/**
 * How a night goes: the five steps of a Lab or PATCH night, shown on Home
 * (Waskar, 10/16/2026; About dropped its copy in the site audit, 10/18/2026). Checked against every past Luma event that
 * day: doors are at 6:00 on every page, and PATCH 001's timed agenda matches
 * these steps. A PATCH is a Lab that mixes several disciplines (code, design,
 * music, visual art), so both run the same night.
 *
 * Earlier copy said "doors at 6:30", "two others join you" and "your first pull
 * request, merged and live". No Luma page supports those, so they are gone.
 * Change a step only when the run of show changes.
 */
export interface NightStep {
  time: string;
  title: string;
  line: string;
}

export const labNight: NightStep[] = [
  { time: '6:00 PM', title: 'Come in.', line: 'Grab food, find a seat, say hi.' },
  { time: '6:30 PM', title: 'Kickoff.', line: "A welcome, then the night's lesson or demo." },
  { time: '7:15 PM', title: 'Build.', line: 'Work with others or on your own. Your call.' },
  { time: '8:15 PM', title: 'Showcase.', line: 'Everyone shares what they made.' },
  {
    time: '9:00 PM',
    title: 'Take it home.',
    line: 'Leave with something you built, to keep working on or add to your portfolio.',
  },
];
