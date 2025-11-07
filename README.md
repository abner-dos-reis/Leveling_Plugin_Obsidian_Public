# 🎮 Leveling System Plugin for Obsidian

Track your progress with an RPG-style leveling system in Obsidian. Gain experience, level up, and visualize your growth.

---

## 🚨 Important
### 📦 Install via NPM 

If you prefer, install dependencies manually before using or building the plugin:

```bash
npm install
```

To build the plugin for distribution:

```bash
npm run build
```

This will generate the compiled version inside the `leveling_plugin/` folder, ready to use in `.obsidian/plugins/`.


### 🚀 Quick Start

1. **Install Plugin**
   Copy the `leveling_plugin` folder to `.obsidian/plugins/`.

2. **Install CSS Snippets**
   Copy all `.css` files from `Custom CSS Snippets/` to `.obsidian/snippets/`
   → Enable them in **Settings → Appearance → CSS Snippets**.

3. **Import Templates**
   Copy files from the `Templates/` folder to your vault’s templates directory.

4. **Enable Plugin**
   Go to **Settings → Community Plugins → Enable “Leveling System”**.

5. **Guideline**
   Download the `Guideline - Leveling System.md` file and place it in a folder named `Guideline` inside your vault.
   It explains **in detail everything the plugin can do** and how to customize it fully.




---

### 📝 Usage

Add properties to your note’s YAML frontmatter:

```yaml
---
Tasks: 5
Mission: 3
Exploration: 2
---
```

Each point = **100 EXP**.
All notes in your vault are automatically scanned.

---

### ✨ Features

* **24 Ranks**: F → EX+++ (0–2,081,600 EXP)
* **Dynamic Charts**: Radar, SWOT, and Wheel of Life visualizations
* **Skills System**: Track Soft, Hard, Power, and Perk skills with categories
* **Auto-Update**: Real-time EXP recalculation
* **Placeholders**: `{total_exp}`, `{level}`, `{rank}`, `{stars}` and more

---

### 📂 Included Folders

* **Templates/** — Starter templates to begin tracking your progress.
* **Custom CSS Snippets/** — Required styles for charts and visuals.
  Copy to `.obsidian/snippets/` and enable via **Settings → Appearance**.

---

### ⚙️ Future Improvement

- **Class System**
- **Buff and Debuff System**

> **I’ve already done that, but I’m testing it before releasing it here.**

#### Buffs x Debuffs
Buffs, when activated, grant EXP and apply an EXP multiplier.
Debuffs steal EXP and reduce the EXP multiplier into the negative.

Buffs/Debuffs that reach EX rank become permanent.

There are conflicts between buffs and debuffs — for example, a Distraction debuff steals EXP from the Focus buff, and vice versa, just like Focus weakens Distraction.

> **There are buffs that come from skills, and skill buffs come from classes and are permanent.**

That said, buffs and debuffs usually last only 24 hours.
They can be **extended or assimilated** (in the case of buffs), or you can **beat them** (in the case of debuffs).

#### Classes (Personas)

Classes (Personas) are study/specialization roadmaps.
Each class has subclasses and grants titles as you progress through the roadmap.
> **Usually requiring tests to advance through each subclass.**

---

The best part? You define all of this using the notes’ YAML.

The guideline explains everything, **but CSS snippets are required** to visualize it properly!
Just like **Templater**, they’re also necessary.

---

### 📜 License

**MIT License** — Free and open-source.

**Attribution Required**
Credit **Abner dos Reis** and link to the [original repository](https://github.com/abner-dos-reis/Leveling_Plugin_Obsidian_Public).

---

### 🔗 Links

* **Author:** [Abner dos Reis](https://github.com/abner-dos-reis)
* **Repository:** [Leveling_Plugin_Obsidian](https://github.com/abner-dos-reis/Leveling_Plugin_Obsidian_Public)



