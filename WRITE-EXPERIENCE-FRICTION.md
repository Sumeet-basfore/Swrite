# SWRITE 2 — Write Experience Friction Audit

| Context | Intent | Expected | Actual | Frequency | Severity | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Long Session Typing** | Maintain flow state | Low input latency (< 10ms) | Smooth `< 2ms` keystroke handling | High | Critical | Verified with 120k word benchmark |
| **In-Editor Search** | Replace character name | Instant match jump | Seamless in-document replace bar | Medium | Major | `FindReplaceBar` added with match counters |
| **Document Navigation** | Jump between scenes/headings | Quick outline without leaving Write | Outline drawer with H1/H2/H3/Scene/Bookmarks | High | Major | `DocumentOutline` added with `Mod+Shift+O` |
| **Table Layout** | Create cast/timeline table | Clean structured grid | Interactive table creation and Tab cell traversal | Low | Medium | `TableCommands` added with GFM roundtrip |
| **Typography Customization** | Select comfortable reading font | Quick preset switch | Five writer presets (Literary, Classic, Modern, Compact, Typewriter) | Medium | Minor | `TYPOGRAPHY_PRESETS` added with CSS variables |
