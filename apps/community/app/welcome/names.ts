const ADJECTIVES = ["Amber", "Quiet", "Golden", "Morning", "Soft", "Bright", "Gentle", "Silver", "Warm", "Still", "Wild", "Velvet"]
const NATURE = ["Fern", "River", "Moss", "Willow", "Fig", "Heron", "Lily", "Meadow", "Rain", "Cedar", "Brook", "Sage"]

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** Adjective plus nature word, for example "Amber Fern" (PRD section 5). */
export function suggestNames(count: number) {
  const names = new Set<string>()
  while (names.size < count) names.add(`${pick(ADJECTIVES)} ${pick(NATURE)}`)
  return [...names]
}
