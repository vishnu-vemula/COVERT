import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme/tokens';

/** The COVERT logo, letter by letter, drawn in a shared coordinate space. */
const LETTERS = {
  C: 'M322 455C302 425 268 408 222 408C160 408 108 458 108 518C108 580 160 628 222 628C262 628 300 618 330 603A128 128 0 0 1 297 528L246 528A28 28 0 1 1 246 508Z',
  O: 'M314 518A111 110 0 1 0 537 518A111 110 0 1 0 314 518ZM391 518A34 33 0 1 1 459 518A34 33 0 1 1 391 518Z',
  V: 'M505 410L578 410C587 410 594 415 598 423L682 596C689 612 677 628 660 628L630 628C618 628 607 621 603 610ZM653 510L693 426C697 416 706 410 718 410L788 410L695 597Z',
  E: 'M722 565L795 425C800 415 808 410 818 410L930 410L930 480L815 480A9.5 9.5 0 0 0 815 499L886 499A23.5 23.5 0 0 1 886 546L815 546A9.5 9.5 0 0 0 815 565L930 565L930 628L775 628C745 628 722 605 722 578Z',
  R: 'M944 628L944 465C944 433 965 410 997 410L1050 410C1092 410 1122 440 1122 480C1122 502 1114 522 1102 535L1172 628L1090 628C1078 628 1068 622 1062 614L1022 559C1020 556 1016 557 1016 561L1016 600C1016 616 1004 628 988 628ZM1052 499A24 24 0 1 0 1004 499A24 24 0 1 0 1052 499Z',
  T: 'M1110 410L1307 410C1325 410 1340 425 1340 445C1340 465 1325 481 1305 481L1264 481L1264 600C1264 616 1251 628 1235 628L1206 628C1190 628 1178 616 1178 600L1178 481L1157 481C1144 481 1135 472 1132 460C1128 442 1120 428 1108 415C1106 413 1107 410 1110 410Z',
} as const;

const WORD = { x: 106, y: 406, width: 1236, height: 224 };
/** The C on its own, used where the full word doesn't fit. */
const MONOGRAM = { x: 106, y: 406, width: 226, height: 224 };

/** The C of the logo, as a compact mark for badges. */
export function Mark({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  const box = MONOGRAM;
  return (
    <View aria-hidden>
      <Svg
        width={(size * box.width) / box.height}
        height={size}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}>
        <Path d={LETTERS.C} fill={inverse ? palette.onInk : palette.ink} />
      </Svg>
    </View>
  );
}

export function Wordmark({ height = 24, inverse = false }: { height?: number; inverse?: boolean }) {
  const box = WORD;
  const fill = inverse ? palette.onInk : palette.ink;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="COVERT">
      <Svg
        width={(height * box.width) / box.height}
        height={height}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}>
        {Object.entries(LETTERS).map(([letter, d]) => (
          <Path key={letter} d={d} fill={fill} fillRule="evenodd" />
        ))}
      </Svg>
    </View>
  );
}
