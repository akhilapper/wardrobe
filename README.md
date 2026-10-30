# Wardrobe Studio

Wardrobe Studio is a self-contained, browser-based tool for exploring color
combinations and planning outfits from your closet. The app currently lives in
[`wardrobe-studio.html`](./wardrobe-studio.html) and does not require a
build step, package installation, or server-side code.

## Run the app

Open `wardrobe-studio.html` in a modern browser. For a local web address
instead of a `file://` page, run this from the project directory with Python 3:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/wardrobe-studio.html>. Stop the server
with Ctrl+C.

## Use the product

The Home screen starts with three common decisions:

- **Plan an outfit** for an occasion and weather, using your saved closet.
- **Buy next** to prioritize missing pieces that unlock more looks.
- **Check a purchase** to see whether a color and garment type you are
  considering works with what you own, and which palette-based outfits it could
  complete.

The main navigation keeps these tasks and **My closet** close at hand. The
secondary links open the Lookbook, Color Library, and Style Profile.

### Color Dictionary

- Search by color name and choose a suggestion, or use the color picker to find
  the closest color in the built-in color list.
- Select **Explore All 348 Palettes** to browse the full set of combinations.
- All palettes are available, with cards added in small batches as you browse.
- Select a palette card to open its larger detail view.

### Check a Purchase

- Choose the garment category and type, then select its color.
- Results show exact-color matches already in your closet and palettes the
  purchase could complete. Any remaining pieces needed for a full look are
  called out.
- Compatibility uses each saved garment's primary color and the built-in
  palette database; it does not inspect store listings or photos.

### My Closet

- Select **Add New Garment** and enter a name, category, type, formality, and
  fit.
- Optionally upload a garment photo. Use **Pick** and click the photo to sample
  a primary or secondary color; without a photo, choose colors from the lists.
- Save the garment to add it to your closet. Use **Delete** on a closet card to
  remove an item.

### Occasion Stylist

- **By Occasion:** choose an occasion and weather, then select **Style Me** to
  see outfit ideas based on your closet.
- **By Item:** choose a garment from the image-backed picker and select
  **Match Item** to see combinations based around it. Garments without a photo
  use a built-in illustration for their type.
- Incomplete outfit cards show the missing palette color on a garment
  illustration and suggest a specific item type, such as jeans, shorts, or
  formal shoes, based on the occasion, weather, and garment formality.
- Suggestions depend on the garments, colors, and attributes you have entered.

### Lookbook

Shows complete outfit combinations and looks that are one piece away, grouped
into situations such as Coffee Date, Office / Business, Summer Casual, and
Festive / Traditional. A near-complete look identifies the missing color and
garment category to consider adding. Looks that need more than one additional
piece are not shown.

### Shopping List

Recommends missing color/category pieces that could unlock additional outfit
combinations for the situations in the lookbook.

### Style Analyzer

- Choose a skin-color swatch, undertone, hair attributes, and face shape; enter
  measurements in inches or centimeters. Height, inseam, and body rise are
  optional; shoulder line, chest, and waist measurements are required. Hip
  circumference is optional and helps distinguish lower-body-dominant shapes.
- Select **Analyze & Style My Closet** to see a geometric silhouette estimate,
  Kibbe-inspired styling language, fit notes, and color suggestions.
- Recommendations use closet tops, bottoms, and footwear that occur together
  in a built-in color palette. A matching outer layer is included when available.
  Outfit cards label trousers/shirts/shoes as the Big–Medium–Small 60/30/10
  color areas.
- The analyzer is a rule-based style guide, not an official Kibbe typing or
  scientific body assessment. It cannot verify fabric weight or tailoring
  details that are not recorded in your closet.
- Measurements are only used in the current page session and are not saved to
  `localStorage`.

## Data and privacy

The palette and color reference data are bundled in the HTML file. Closet items
are saved in this browser's `localStorage` under the key `my_closet_v2`,
including uploaded photos stored as image data. Your closet is not currently
synced to an account or shared with other people.

Browser storage is tied to the browser and the page's origin. Opening the file
directly and serving it from `localhost` may use separate storage areas. Use
the same browser and address to see the same closet. Clearing browser/site data
or using private browsing can make saved items unavailable; the current app
does not provide export, backup, account sign-in, or cross-device sync.

## Current scope and future hosting

This is a static, single-page app with focused task flows. It has no user
accounts, hosted database, or friend-sharing permissions yet. To make wardrobes
available online across devices and support friends, the app will need
authentication, per-user database records and private image storage, plus
access controls. Keep each person's closet private by default and add explicit
sharing separately.
