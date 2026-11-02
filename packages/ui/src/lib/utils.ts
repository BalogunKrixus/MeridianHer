import { createCn } from "cn/config"

/**
 * Class merging that knows our type ramp (preset.css). `text-h2` sets size,
 * weight, leading and tracking, so it replaces a component's `text-base` and
 * `font-medium` instead of being mistaken for a colour.
 */
export const cn = createCn({
  extend: {
    classGroups: { "type-ramp": [{ text: ["display", "h1", "h2", "h3", "body", "small"] }] },
    conflictingClassGroups: { "type-ramp": ["font-size", "font-weight", "leading", "tracking"] },
  },
})
