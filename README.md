# Soulsborne Archive

Soulsborne Archive is an English-language, fan-made website about four FromSoftware games: **Elden Ring**, **Bloodborne**, **Dark Souls III**, and **Sekiro: Shadows Die Twice**. It started as a UMSZKI student project. The Archive brings together setting and story, maps, game mechanics, and artwork, with a guide for choosing a first game and a hidden collectible quest that ties the four worlds together.

The site has five pages. The [homepage](index.html) is the entrance to the Archive. Each game has a dedicated chapter with its own artwork, colors, and field notes. The project uses HTML, CSS, vanilla JavaScript, and bundled media. It can be opened locally or served by a static web server.

## Contents

- [Open and explore the site](#open-and-explore-the-site)
- [How the site evolved](#how-the-site-evolved)
- [Homepage tour](#homepage-tour)
- [The four game chapters](#the-four-game-chapters)
- [Artwork and map viewer](#artwork-and-map-viewer)
- [Appearance, motion, and visual design](#appearance-motion-and-visual-design)
- [The hidden bonfire and other details](#the-hidden-bonfire-and-other-details)
- [Accessibility and responsive behavior](#accessibility-and-responsive-behavior)
- [Project structure and maintenance](#project-structure-and-maintenance)
- [Credits and license](#credits-and-license)

## Open and explore the site

Open `index.html` from the project folder in a current desktop or mobile browser. To run it over HTTP, open a terminal in that folder and use the following command if Python is installed. The server uses the files directly from the project folder.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [the local homepage](http://127.0.0.1:8000/) and leave the terminal running while you browse. Use `Ctrl+C` in the terminal to stop the server. An HTTP address also gives the five pages a shared browser origin for appearance, motion, and bonfire progress. Browsers can handle storage for locally opened files differently, so use the server when checking whether a setting carries from one page to another.

1. Use **Explore the worlds** to see all four chapters, or choose a world in the hero and follow **Enter …** to open its chapter.
2. Visit **Find your first world** to compare the kinds of exploration and combat the games emphasize.
3. Use **Gallery** to enter **Beyond the fog**. Browse the scenes, then open a piece of artwork to inspect it.
4. On a chapter page, use **Story**, **World Map**, and **Field Notes** to jump to a section. The bottom of each chapter leads to the next game.
5. On the homepage, open **Relics** to read the bonfire journal. The journal includes in-page hints if you want to discover the marks yourself.

## How the site evolved

The early project was already organized around a homepage and four game pages. Its homepage introduced the genre, linked to the games, and presented a repeating landscape strip. The original README captured that plan as a checklist and two page sketches. The current Archive carries that structure forward and gives each area a clearer purpose.

| Area | How it changed |
| --- | --- |
| Homepage | The site now opens on a selectable four-world hero. The scene, accent, region, atmospheric effects, and chapter link change together. Four illustrated cards provide direct chapter links. |
| Game pages | The setting, map, and recognizable game elements became a consistent **Setting & story**, **World map**, and **Field notes** format, with chapter navigation and a next-game link. |
| Landscape strip | The 12 scenes became a browsable, looping gallery with a scene counter, captions, scene buttons, autoplay controls, keyboard navigation, and a full-size viewer. The original location references are available from the viewer. |
| New editorial sections | A playstyle guide helps people choose where to begin. **Echoes of the worlds.** uses real-world photographs to show visual parallels with the games. The genre section explains three shared design ideas. |
| Visual system | The pages share a dark editorial layout, world-specific accents, layered hero artwork, and common controls. The Appearance panel and Motion toggle let readers change how the site feels. |
| Hidden content | Four marks on the homepage lead to a bonfire, a collection of checkpoint notes, and an ember trail that can follow the visitor across chapters. |
| Files and documentation | The homepage and README sit at the top level. Chapters, styles, scripts, artwork, and the license have dedicated folders. This guide describes the implemented site. |

The two most recent commits before the folder reorganization provide the main historical reference. `2998636` introduced the redesigned pages, shared scripts, guide, appearance panel, photographic comparisons, and relic journal. `e2d13fd` refined the design and added the shared bonfire effects and ember-trail controls.

## Homepage tour

### The world selector and chapter cards

The hero opens on Limgrave, with Elden Ring selected. Its four buttons show the game names and release years. Choosing another game updates the **Now viewing** region, artwork, accent, selection state, and chapter link. The other three scenes show Bloodborne’s blood moon, Dark Souls III’s Irithyll, and Sekiro’s mountains. Each scene is loaded when the button is first hovered, focused, or selected. The selector waits for image decoding when it changes the scene.

Use the buttons, `←` and `→`, or `Home` and `End`. On the compact two-column layout, `↑` and `↓` move between rows. A horizontal swipe on the hero artwork also changes the active world. The four cards in **The worlds.** provide independent links, so you can go straight to any chapter.

### Find your first world

The field guide pairs a short recommendation and an illustrated chapter link with each playstyle. Its choices are tabs. Arrow keys move among them, while `Home` and `End` jump to the beginning or end.

| Choice | Suggested world | What the recommendation emphasizes |
| --- | --- | --- |
| Roam freely | Elden Ring | Explore the Lands Between with Torrent, detour around a difficult encounter, and return later. |
| Fight up close | Bloodborne | Act quickly during close combat and use Rally to recover a portion of newly lost health. |
| Watch for openings | Dark Souls III | Read attacks, manage stamina, and work from bonfire to bonfire. |
| Master deflection | Sekiro | Time deflections and build posture pressure to create an opening for a deathblow. |

### Beyond the fog

The landscape gallery contains 12 original cards, three per game. Its readout shows the selected game, scene position, and a short note about the image. Select **Previous**, **Next**, or a scene cue, drag the track with a mouse, or swipe it on a touchscreen. With the track focused, use `←`, `→`, `Home`, or `End` to browse and `Enter` or `Space` to open the current image.

| Game | Scenes in the gallery |
| --- | --- |
| Elden Ring | Cerulean Coast, Leyndell, Royal Capital, and Liurnia of the Lakes |
| Bloodborne | Old Yharnam, Moon Presence, and Hunter’s Dream |
| Dark Souls III | Irithyll of the Boreal Valley, Lothric Castle, and Gael’s arena |
| Sekiro | Ashina Reservoir, Fountainhead Palace, and Senpou Temple |

The gallery drifts by default on a wide screen with a fine pointer when motion is enabled. Its playback button lets you pause it or explicitly start it, including on a compact layout. Playback waits while you drag the track, use its keyboard controls, inspect an image, or leave the gallery out of view. A few inert copies at the edges make the loop look continuous while keeping one set of actionable scene links. The counter continues to use the 12 originals.

### Echoes of the worlds

Four real-world photographs are presented as visual parallels. Each card opens the shared artwork viewer. Expand **Photo credits** below the cards to see the photographers and source links.

| Photograph | Parallel drawn by the site |
| --- | --- |
| Dunnottar Castle, Scotland | A fortress on a sea cliff recalls the approach to Stormveil in Elden Ring. |
| Whitby Abbey, England | Gothic arches and an open silhouette recall Yharnam. |
| A fire in the dark | A fire in a snowy forest evokes a place to rest in Dark Souls III. |
| Autumn at Kiyomizu-dera, Japan | The pagoda and red foliage recall the climb to Senpou Temple in Sekiro. |

### What makes a Soulsborne?

The genre section introduces the fan term and highlights environmental storytelling, high-stakes combat, and interconnected worlds. Its artwork group includes an image of the four worlds, FromSoftware cover art, and a **The death screen** link that opens the **You Died** image. The latter is a small visual callback to one of the series’ most familiar screens.

## The four game chapters

Each chapter opens with a world-specific hero and shortcuts to the story and map. The chapter bar follows the reader down the page on taller layouts and highlights the current section as they scroll. Story sections pair two illustrated passages with captions. **World map** presents an image you can enlarge and pan. **Field notes** describe selected people, places, equipment, and mechanics, with additional artwork where available. The next-chapter links form a loop from Elden Ring to Bloodborne to Dark Souls III to Sekiro and back to Elden Ring.

### Elden Ring · The Lands Between · 2022

**A kingdom in pieces** follows the Shattering, the demigods, and the return of a Tarnished. **A choice beyond the throne** takes the reader from Limgrave through the wider Lands Between and introduces possible directions for the ending. The chapter opens a full map of the Lands Between. Field notes cover Malenia, Let Me Solo Her, Rivers of Blood and Moonveil, Torrent, Ranni the Witch, and the Erdtree. The additional images include Malenia art, two landscape views, and loading artwork. [Open the Elden Ring chapter](pages/er.html)

### Bloodborne · Yharnam · 2015

**The night of the Hunt** covers Yharnam, its blood healing, and the Hunter’s Dream. **The things that watch** follows the story from Gothic horror into nightmares, Insight, and the Great Ones. The map shows Yharnam and beyond. The five field notes cover Lady Maria, the Saw Cleaver, Rally, Insight, and Central Yharnam. A piece of loading artwork accompanies the notes. [Open the Bloodborne chapter](pages/bb.html)

### Dark Souls III · Lothric · 2016

**An age reduced to ash** introduces the fading First Flame, the absent Lords of Cinder, and the Ashen One. **The cost of another cycle** reflects on Lothric, Farron, and Irithyll and the decision about whether to prolong the Age of Fire. There is a main map and a separate illustrated view of Lothric. Field notes cover the Abyss Watchers, Farron Greatsword, Siegward of Catarina, Ember, Soul of Cinder, and the bonfire. [Open the Dark Souls III chapter](pages/ds3.html)

### Sekiro: Shadows Die Twice · Ashina · 2019

**An oath in a dying land** places Wolf’s duty to Kuro against the collapse of Ashina. **The price of immortality** explores the Dragon’s Heritage, the Iron Code, and Wolf’s choices. The map group offers three views of Ashina. Field notes cover Sword Saint Isshin, the Mortal Blade, deflection, Dragonrot, the Mikiri Counter, and resurrection. The accompanying images show Rot Essence and a death screen. [Open the Sekiro chapter](pages/sekiro.html)

## Artwork and map viewer

Select a gallery card, story illustration, map, field-note image, real-world photo, or genre image to open the shared viewer. The images are grouped by their section, so the **Previous** and **Next** buttons cycle within the collection you opened. The arrows also navigate a multi-image group while the image is fitted. The main landscape scenes show **Read about this place** for their linked reference pages.

- **Fit** restores the starting view. `+` and `−` change magnification, up to four times the fitted size.
- At higher magnification, drag with the mouse or scroll or pan within the viewer to inspect details. Each image starts fitted when you switch to it.
- Use **Close**, `Esc`, or the backdrop to dismiss the viewer. Focus goes back to the link that opened it.
- A browser with JavaScript disabled can still open the linked image directly. The maps are full-size illustrations with zoom and pan provided by the viewer.

## Appearance, motion, and visual design

The Archive uses dark backgrounds, pale text, large Georgia display headings, a system sans serif for long text, and a system monospace for labels. Seagram is bundled locally and used for the footer rune. The home hero layers the artwork, shades, canvas particles, and an ornamental dial. Framed cards, serif captions, and a thin progress indicator carry the same design into the game chapters.

The default **World colors** palette uses gold for Elden Ring, red and rose for Bloodborne, a blue-gray accent for Dark Souls III, and warm orange for Sekiro. The atmospheric particles echo the worlds independently, with graces and glints, mist, rising embers, and drifting leaves. With motion enabled, moving a mouse through the hero moves the artwork and dial slightly and sheds a few particles. Clicking an open part of the hero artwork sends out a brief pulse. Cards can tilt under the mouse, sections reveal as they come into view, and browsers that support same-origin view transitions can animate navigation between pages.

**Appearance** is available in every page’s header. Color palettes are **World colors**, **Ember**, **Moonlight**, and **Noir**. They update accents, backgrounds, and image treatments as you select them. The **Soft**, **Cinematic**, and **Charged** atmosphere settings change the intensity of glow, particles, and parallax. **Restore defaults** returns the palette to World colors and the atmosphere to Cinematic. **Done** closes the panel, and `Esc` also dismisses it.

**Motion** in the header is a separate control. Its initial value follows the browser’s reduced-motion preference until the visitor chooses a setting. Switching motion off suppresses effects such as hero particles, card tilt, animated transitions, and ember bursts. Gallery navigation and the bonfire quest remain usable. Gallery autoplay has its own playback control, while the unlocked **Ember trail** has a separate saved switch.

## The hidden bonfire and other details

The **Relics** link goes to **The hidden bonfire.** The journal starts with a count of zero marks, four expandable clues, and a dormant fire. Each clue includes a link to the area where its mark is hidden. Inspecting a mark updates the count and clue entry, reveals a short lore note, and opens a message with a link back to the journal. Finding the fourth mark changes the message link to **Return to the bonfire**.

<details>
<summary>Show the four mark locations</summary>

| Mark | Where to find it |
| --- | --- |
| Grace | The diamond beside **Now viewing** in the hero’s world selector. |
| Insight | The eye on the Bloodborne card in **The worlds.** |
| Ashina leaf | The leaf on the Sekiro card in **The worlds.** |
| Ember | The small spark beside the site credits at the end of the homepage. |

</details>

With all four marks collected, select **Kindle the fire**. The journal marks the bonfire as kindled and reveals the following rewards.

- **Ember trail unlocked** adds a trail for mouse or pen movement and a burst for a touch tap. With motion on, the trail works on the homepage and all four chapters. You can toggle it in the reward area or in the **Bonfire reward** section of Appearance.
- **Places to rest** describes four checkpoints, with links to their chapters. Lothric has bonfires, the Lands Between has sites of grace, Yharnam’s lanterns connect to the Hunter’s Dream, and Ashina has Sculptor’s Idols.
- **Before you head back out** adds a credited forest photograph and reminders to check supplies, pick a landmark, and choose one goal for the next stretch.

The initial kindling sends a firelight wash and sparks across the page when motion is on. The button then becomes **Tend the fire** and can flare it again. Its permanent journal state is separate from the animation. Revisit any found mark to reread its note without increasing the count.

### What the browser saves

The scripts use `localStorage` where available. Settings and discoveries belong to that browser and site address. A different browser profile or URL origin has a separate set of values. When storage is unavailable, the controls and journal still work in memory for the current page. For a fresh playthrough, open the HTTP site in a new browser profile or clear this site’s data and reload. Clearing site data also clears appearance and motion choices.

| Storage key | Value |
| --- | --- |
| `soulsborne-archive-appearance` | JSON with the chosen `palette` and `intensity`. |
| `soulsborne-archive-motion` | `on` or `off` after an explicit motion choice. |
| `soulsborne-archive-relic:grace`, `:eye`, `:leaf`, `:ember` | `true` for each discovered mark. The abbreviated keys in this row share the `soulsborne-archive-relic` prefix. |
| `soulsborne-archive-relic:kindled` | `true` after lighting the bonfire. |
| `soulsborne-archive-relic:ember-trail` | `on` or `off` after changing the trail preference. |

## Accessibility and responsive behavior

- The pages have labelled navigation, a **Skip to content** link, visible keyboard focus, and heading and landmark structure. The selector announces changes to the current world, the gallery reports manual scene changes, and the journal announces discoveries and kindling.
- The guide exposes keyboard-operable tabs. The appearance panel and viewer use native dialogs. Buttons and images use accessible names, captions, or text alternatives where they convey information. Decorative artwork and canvas layers are hidden from assistive technology.
- The fixed header and reading progress indicator are shared across pages. The chapter bar is sticky where height allows, and the scripts measure the header and chapter bar to keep anchored headings clear.
- At narrower widths, the header puts navigation below the brand and controls, the guide and world selector compact into grids, and most content cards and story rows stack. The mobile viewer rearranges its controls below its title. Landscape rules reduce the height used by heroes and navigation.
- The initial hero image is prioritized, secondary hero scenes load on demand, and many below-the-fold images use lazy loading. Hero animation and gallery autoplay stop when they are out of view. The ember trail stops when motion is off or the tab is hidden.
- With JavaScript disabled, the site still shows its chapters, images, text, navigation, and the full set of guide recommendations. An illustrated bonfire and a short explanatory note remain on the homepage, while the interactive journal needs JavaScript.

## Project structure and maintenance

```text
./
├── index.html                Homepage and entry point
├── README.md                 Project documentation
├── pages/
│   ├── er.html               Elden Ring
│   ├── bb.html               Bloodborne
│   ├── ds3.html              Dark Souls III
│   └── sekiro.html           Sekiro: Shadows Die Twice
├── styles/
│   ├── soulsborne.css        Shared layout, hero, gallery, viewer, and typography
│   ├── games.css             Chapter layout, maps, field notes, and chapter bar
│   ├── appearance.css        Palette and atmosphere overrides and the settings panel
│   ├── guide.css             Field guide layout and tab transitions
│   ├── relics.css            Marks, journal, toast, fire scene, and reward panels
│   └── bonfire.css           Page-wide bonfire effects
├── scripts/
│   ├── archive.js            Reading progress, motion, hero, gallery, and viewer
│   ├── appearance.js         Appearance panel, defaults, and saved preferences
│   ├── guide.js              Playstyle tab selection and keyboard navigation
│   ├── relics.js             Discovery, journal, kindling, and reward content
│   └── bonfire.js            Shared fire effects and ember trail
├── Assets/
│   ├── ER/                   Elden Ring art and map
│   ├── Bloodborne/           Bloodborne art and map
│   ├── DS3/                  Dark Souls III art and maps
│   ├── Sekrio/               Sekiro art and maps under the existing folder spelling
│   ├── previews/             Preview and scene images
│   ├── echoes/               Real-world photographs
│   └── other/                Shared artwork, loading screens, and the local font
└── legal/
    └── LICENSE               MIT software license
```

A Git checkout also includes the hidden `.git/` directory, which holds repository history and configuration.

### Relative paths

The homepage links to a chapter as `pages/er.html` and loads shared resources with paths such as `styles/soulsborne.css` and `scripts/archive.js`. Chapter pages link to their siblings as `bb.html` or `ds3.html`, go back to the homepage with `../index.html`, and load shared files through `../styles/`, `../scripts/`, and `../Assets/`. The CSS font URL is relative to the stylesheet and points to `../Assets/other/Seagram%20tfb.ttf`.

Keep the directory layout intact when deploying the site. Its local links are relative, so it can also be hosted under a subdirectory. File and folder case matters on many hosts. Use the spelling in the file tree, including `Assets` and `Sekrio`. If you saved a link to a game page before the move, update it to include `pages/`.

### Where to make changes

- Edit `index.html` to change the homepage, hero scenes, gallery, clue text, or guide recommendations. When changing a hero option, check its world key, scene, region, and `data-chapter` path together. The selector uses that path for the chapter link.
- Edit the relevant file in `pages/` to change the story, maps, field notes, or related images. `data-lightbox` enables the viewer and `data-gallery` tells it which images should be browsed together.
- Edit `styles/soulsborne.css` for the shared layout and world accents, `styles/games.css` for chapter-specific styles, or the feature stylesheet in the file tree for an individual component.
- The page loads its scripts with `defer`. Appearance sets the initial palette and atmosphere, `archive.js` applies motion and initializes shared interactions, and the remaining scripts enhance the sections they control. Keep `relics.js` and `bonfire.js` connected through the `archive:bonfire` event when changing kindling behavior. The homepage-only guide and journal are loaded from `index.html`.

### Checks after moving a file

1. Open the homepage and all four chapters. Follow the hero’s chapter link, a guide link, the next-chapter links, the chapter navigation, and the links back home.
2. Switch through all the hero images and open the landscape gallery, the photographic comparisons, and a map from each chapter. Check thumbnail loads, full-size images, zoom, and the footer font.
3. At a narrow width, check the header, world selector, gallery and its controls, and the chapter bar. Try keyboard navigation and switch motion off.
4. On the local HTTP server, change appearance, collect the four marks, kindle the bonfire, and follow a reward link to a chapter. Reload to check the saved choices and use the ember-trail switch on both pages.

## Credits and license

Soulsborne Archive is an independent educational and portfolio project by a UMSZKI student. Game images, characters, and trademarks belong to their respective rights holders. FromSoftware, Bandai Namco Entertainment, and Sony Interactive Entertainment are among the companies associated with the featured games. For a media inquiry or removal request, contact the author or open an issue through the repository link in the site footer.

The homepage credits Clément Proust for Dunnottar Castle, Shuo Wang for Whitby Abbey, Alec Krum for the forest bonfire, and Satvik for Kiyomizu-dera. The bonfire reward credits Cedé Joey for the forest trail. The site links to those photo sources and to community reference pages for the gallery locations. [See the credits on the homepage](index.html#echoes)

The software is distributed under the MIT license. The original copyright and permission notice is included with the project. [Read the license](legal/LICENSE)
