import type { CovertDocument, Table } from '@covert/shared';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

import { rowPhrase, splitForSpeech, summaryPhrase, tableIntro } from '@/lib/speech/phrases';
import { useSettings, type SpeechRate } from '@/stores/settings';

export type ReaderMode = 'summary' | 'table';

export interface Reader {
  mode: ReaderMode;
  playing: boolean;
  /** Row the table reader is on (also the row highlighted in the table). */
  row: number;
  rate: SpeechRate;
  /** Switches to a mode and starts reading it. */
  choose: (mode: ReaderMode) => void;
  setRate: (rate: SpeechRate) => void;
  play: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
}

const MAX_UTTERANCE = Math.min(Speech.maxSpeechInputLength || 4000, 1000);

/**
 * Reads a summary or a table aloud with device text-to-speech, one short
 * utterance at a time. A generation counter makes every new request cancel the
 * previous chain, so speech never overlaps.
 */
export function useReader(document: CovertDocument | undefined, table: Table | undefined): Reader {
  const defaultRate = useSettings((state) => state.speechRate);
  const readColumnNames = useSettings((state) => state.readColumnNames);
  const [mode, setModeState] = useState<ReaderMode>('table');
  const [playing, setPlaying] = useState(false);
  const [row, setRow] = useState(0);
  const [rate, setRateState] = useState<SpeechRate>(defaultRate);
  const generation = useRef(0);

  const halt = useCallback(() => {
    generation.current += 1;
    void Speech.stop();
    setPlaying(false);
  }, []);

  /** Speaks utterances in order; resolves true if every one finished uninterrupted. */
  const speakAll = useCallback(
    (texts: string[], speed: number, id: number) =>
      new Promise<boolean>((resolve) => {
        const queue = texts.flatMap((text) => splitForSpeech(text, MAX_UTTERANCE));
        const step = () => {
          if (id !== generation.current) return resolve(false);
          const text = queue.shift();
          if (text === undefined) return resolve(true);
          Speech.speak(text, {
            rate: speed,
            onDone: step,
            onStopped: () => resolve(false),
            onError: () => resolve(false),
          });
        };
        step();
      }),
    [],
  );

  const readTableFrom = useCallback(
    async (start: number, speed: number) => {
      if (!table) return;
      generation.current += 1;
      const id = generation.current;
      await Speech.stop();
      setPlaying(true);
      for (let index = start; index < table.rows.length; index += 1) {
        if (id !== generation.current) return;
        setRow(index);
        const texts = [rowPhrase(table, index, readColumnNames)];
        if (index === 0 && start === 0) texts.unshift(tableIntro(table));
        const finished = await speakAll(texts, speed, id);
        if (!finished) return;
      }
      // Finished the table: the next Play starts from the top.
      if (id === generation.current) {
        setPlaying(false);
        setRow(0);
      }
    },
    [table, readColumnNames, speakAll],
  );

  const readSummary = useCallback(
    async (speed: number) => {
      if (!document) return;
      generation.current += 1;
      const id = generation.current;
      await Speech.stop();
      setPlaying(true);
      await speakAll([summaryPhrase(document)], speed, id);
      if (id === generation.current) setPlaying(false);
    },
    [document, speakAll],
  );

  const play = useCallback(() => {
    if (mode === 'summary') void readSummary(rate);
    else void readTableFrom(row, rate);
  }, [mode, rate, row, readSummary, readTableFrom]);

  const move = useCallback(
    (delta: number) => {
      if (!table || table.rows.length === 0) return;
      const target = Math.min(Math.max(row + delta, 0), table.rows.length - 1);
      setModeState('table');
      void readTableFrom(target, rate);
    },
    [table, row, rate, readTableFrom],
  );

  const choose = useCallback(
    (next: ReaderMode) => {
      setModeState(next);
      if (next === 'summary') void readSummary(rate);
      else void readTableFrom(row, rate);
    },
    [rate, row, readSummary, readTableFrom],
  );

  const setRate = useCallback(
    (next: SpeechRate) => {
      setRateState(next);
      if (!playing) return;
      // Restart the current utterance at the new speed.
      if (mode === 'summary') void readSummary(next);
      else void readTableFrom(row, next);
    },
    [playing, mode, row, readSummary, readTableFrom],
  );

  // A different table starts from its first row, with any speech for the old one stopped.
  const tableId = table?.id;
  const [readingTable, setReadingTable] = useState(tableId);
  if (readingTable !== tableId) {
    setReadingTable(tableId);
    setRow(0);
    setPlaying(false);
  }
  useEffect(
    () => () => {
      generation.current += 1;
      void Speech.stop();
    },
    [tableId],
  );

  // Leaving the screen (or the app navigating elsewhere) stops speech cleanly.
  useFocusEffect(useCallback(() => halt, [halt]));
  useEffect(() => halt, [halt]);

  return {
    mode,
    playing,
    row,
    rate,
    choose,
    setRate,
    play,
    stop: halt,
    next: () => move(1),
    previous: () => move(-1),
  };
}
