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

## Run the tests

The test suite uses Node.js built-in tools and needs no package install. Run it
after every code change:

```sh
npm test
```

Tests check the HTML and JavaScript, stored color and outfit data, and the rules
used to score outfit shapes and possible purchases.

## Use the product

If this is your first visit, start by adding a few things you already wear,
such as a top, pants or skirt, and shoes. Photos and measurements are optional.
Then choose where you are going and the weather to get outfit ideas.

From Home, you can also:

- **Plan an outfit** for an occasion and weather, using clothes you added.
- **What to buy** to find new pieces that could work with what you own.
- **Check before buying** to see whether a new item could go with your clothes.

The other links are optional: **Style ideas**, **Color guide**, and **Your
preferences**.

### Color guide

- Search by color name and choose a suggestion, or use the color picker to find
  the closest color in the built-in list.
- Select **Explore all color combinations** to browse the available options.
- More combinations appear in small batches as you browse. Select one to see
  the colors together in a larger view.

### Check before buying

- Choose the kind of clothing and its color, then select **See if it matches**.
- Results show clothes you own that could go with it and any other pieces that
  could complete an outfit.
- Compatibility uses each saved garment's primary color and the built-in
  palette database; it does not inspect store listings or photos.

### My Closet

- Select **Add a clothing item**, choose what it is, and choose its main color.
- A name and photo are optional. The color square lets you choose a close
  match; open **Choose a color name or pick a color from your photo** for other
  options.
- Open **Extra details** only if you want to add more. It is fine to leave these
  blank. Use **Edit details** to change an item or add details later.
- Use **Delete** on a clothing card to remove it.

### Plan an outfit

- Choose where you are going and the weather, then select **Show outfit ideas**.
- Or choose **Start with one item**, select something from your clothes, and
  see ideas built around it.
- If you have not added clothes yet, select **Add clothes** when prompted.
- Clothes without a photo use a simple illustration.
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

### What to buy

Recommends missing color/category pieces that could unlock additional outfit
combinations for the situations in the lookbook.

### Your preferences

- This section is optional. Choose whether you prefer more shape at the
  shoulders or a long, clean line, then select **Show my outfit ideas**.
- Open the extra details only if you want to share color, hair, or measurement
  preferences. Measurements are optional.
- Suggestions use the clothing and details you saved. If a detail is unknown,
  leave it blank; you can add or change details later.
- Known incompatible metadata is excluded; unknown tags are not guessed and
  appear as optional styling tips.

## Data and privacy

The palette and color reference data are bundled in the HTML file. Closet items
are saved in this browser's `localStorage` under the key `my_closet_v2`,
including uploaded photos stored as image data. Proportion profile fields are
saved under `style_profile_v1`. This app currently has no Dexie/IndexedDB layer
or REST synchronization endpoint; both datasets remain local to this browser.
Your closet is not currently synced to an account or shared with other people.

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
