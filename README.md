# Wardrobe Studio

Wardrobe Studio is a self-contained, browser-based tool for exploring color
combinations and planning outfits from your closet. The app currently lives in
[`color_dashboard_v12.html`](./color_dashboard_v12.html) and does not require a
build step, package installation, or server-side code.

## Run the app

Open `color_dashboard_v12.html` in a modern browser. For a local web address
instead of a `file://` page, run this from the project directory with Python 3:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/color_dashboard_v12.html>. Stop the server
with Ctrl+C.

## Use the product

The navigation at the top switches between five tools:

### Color Dictionary

- Search by color name and choose a suggestion, or use the color picker to find
  the closest color in the built-in color list.
- Select **Explore All 348 Palettes** to browse the full set of combinations.
- Select a palette card to open its larger detail view.

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
- **By Item:** choose a garment and select **Match Item** to see combinations
  based around it.
- Suggestions depend on the garments, colors, and attributes you have entered.

### Lookbook

Shows complete outfit combinations from your closet, grouped into situations
such as Coffee Date, Office / Business, Summer Casual, and Festive / Traditional.
If there are no suitable complete looks, add more garments with complementary
colors and categories.

### Shopping List

Recommends missing color/category pieces that could unlock additional outfit
combinations for the situations in the lookbook.

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

This is a static, single-page prototype. It has no user accounts, hosted
database, or friend-sharing permissions yet. To make wardrobes available
online across devices and support friends, the app will need authentication,
per-user database records and private image storage, plus access controls.
Keep each person's closet private by default and add explicit sharing separately.
