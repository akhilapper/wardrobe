const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'wardrobe-studio.html'), 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inlineScript, 'The app should have an inline JavaScript block.');

const colorDataMatch = inlineScript.match(
    /const colorsData = (\[[\s\S]*?\]);\s*const combinations = (\{[\s\S]*?\});/
);
assert.ok(colorDataMatch, 'The color and outfit data should be valid JSON.');
const colorsData = JSON.parse(colorDataMatch[1]);
const combinations = JSON.parse(colorDataMatch[2]);

function getFunctionSource(functionName) {
    const functionStart = inlineScript.indexOf(`function ${functionName}(`);
    assert.notEqual(functionStart, -1, `Could not find function ${functionName}.`);

    const bodyStart = inlineScript.indexOf('{', functionStart);
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let templateString = false;

    for (let index = bodyStart; index < inlineScript.length; index++) {
        const character = inlineScript[index];
        const nextCharacter = inlineScript[index + 1];

        if (lineComment) {
            if (character === '\n') lineComment = false;
            continue;
        }
        if (blockComment) {
            if (character === '*' && nextCharacter === '/') {
                blockComment = false;
                index++;
            }
            continue;
        }
        if (quote) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === quote) quote = null;
            continue;
        }
        if (templateString) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === '`') templateString = false;
            continue;
        }
        if (character === '/' && nextCharacter === '/') {
            lineComment = true;
            index++;
            continue;
        }
        if (character === '/' && nextCharacter === '*') {
            blockComment = true;
            index++;
            continue;
        }
        if (character === "'" || character === '"') {
            quote = character;
            continue;
        }
        if (character === '`') {
            templateString = true;
            continue;
        }
        if (character === '{') depth++;
        if (character === '}' && --depth === 0) {
            return inlineScript.slice(functionStart, index + 1);
        }
    }

    assert.fail(`Function ${functionName} has no closing brace.`);
}

function loadFunction(functionName, globals = {}) {
    return vm.runInNewContext(`(${getFunctionSource(functionName)})`, globals);
}

const hexToRgb = loadFunction('hexToRgb');
const getBasicColorName = loadFunction('getBasicColorName', { hexToRgb });
const getSimpleClothingGroupName = loadFunction('getSimpleClothingGroupName');
const findClosestColor = loadFunction('findClosestColor', { colorsData });
const colorDistance = loadFunction('colorDistance', { hexToRgb });
const scoreAnalyzerColor = loadFunction('scoreAnalyzerColor', { colorDistance });
const analyzerFitBonus = loadFunction('analyzerFitBonus');
const evaluateProportionalConstraint = loadFunction('evaluateProportionalConstraint');
const purchaseRoleGroups = loadFunction('purchaseRoleGroups');
const evaluatePurchaseCandidate = loadFunction('evaluatePurchaseCandidate', {
    closetData: [],
    purchaseRoleGroups
});

function makeProfile(overrides = {}) {
    return {
        Height_cm: null,
        Build_Type: 'AVERAGE',
        Head_Volume: 'AVERAGE',
        Target_Silhouette: 'V_SILHOUETTE',
        ...overrides
    };
}

function makeTop(overrides = {}) {
    return {
        Top_Length: null,
        Fabric_Type: null,
        Fabric_Weight: null,
        ...overrides
    };
}

function makeBottom(overrides = {}) {
    return {
        Rise_Height: null,
        Cut: null,
        Hem_Break: null,
        fit: '',
        ...overrides
    };
}

test('the full inline script parses as JavaScript', () => {
    assert.doesNotThrow(() => new vm.Script(inlineScript));
});

test('the HTML uses unique IDs and every explicit label points to an existing field', () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicateIds)], []);

    const missingLabels = [...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)]
        .map(match => match[1])
        .filter(labelTarget => !ids.includes(labelTarget));
    assert.deepEqual(missingLabels, []);
});

test('HTML action buttons call functions that exist in the app', () => {
    const inlineActions = [
        ...html.matchAll(/\bon(?:click|change|submit|input|keydown)\s*=\s*["']\s*([A-Za-z_$][\w$]*)\s*\(/gi)
    ].map(match => match[1]);
    const missingFunctions = inlineActions.filter(name =>
        !new RegExp(`function\\s+${name}\\s*\\(`).test(inlineScript)
    );
    assert.deepEqual([...new Set(missingFunctions)], []);
});

test('closet and profile storage keys stay stable', () => {
    assert.match(inlineScript, /my_closet_v2/);
    assert.match(inlineScript, /style_profile_v1/);
    assert.match(html, /No photos, measurements, or special fashion knowledge needed\./);
});

test('color data has unique names, valid colors, and valid palette references', () => {
    const colorNames = colorsData.map(color => color.name);
    assert.equal(new Set(colorNames).size, colorNames.length);

    for (const color of colorsData) {
        assert.match(color.hex, /^#[\da-f]{6}$/i, `${color.name} should have a six-digit hex value.`);
        assert.equal(color.rgb.length, 3, `${color.name} should have three RGB values.`);
        assert.ok(color.rgb.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255));
        for (const combinationId of color.combinations) {
            assert.ok(combinations[combinationId], `${color.name} refers to missing palette ${combinationId}.`);
        }
    }

    for (const [combinationId, palette] of Object.entries(combinations)) {
        assert.ok([2, 3, 4].includes(palette.length), `Palette ${combinationId} should have two to four colors.`);
        for (const color of palette) {
            assert.match(color.hex, /^#[\da-f]{6}$/i, `Palette ${combinationId} has an invalid color.`);
            assert.ok(colorNames.includes(color.name), `Palette ${combinationId} refers to unknown color ${color.name}.`);
        }
    }
});

test('hexToRgb accepts common valid formats and rejects bad input', async t => {
    const cases = [
        ['#000000', { r: 0, g: 0, b: 0 }],
        ['#ffffff', { r: 255, g: 255, b: 255 }],
        ['#12aBcF', { r: 18, g: 171, b: 207 }],
        ['12ABCf', { r: 18, g: 171, b: 207 }],
        ['', null],
        ['#fff', null],
        ['#12345g', null],
        ['#12345678', null],
        [null, null]
    ];
    for (const [value, expected] of cases) {
        await t.test(String(value), () => assert.deepEqual(
            JSON.parse(JSON.stringify(hexToRgb(value))),
            expected
        ));
    }
});

test('basic color names cover each color family and gray level', async t => {
    const cases = [
        ['#000000', 'black'],
        ['#ffffff', 'white'],
        ['#333333', 'charcoal'],
        ['#cccccc', 'light gray'],
        ['#808080', 'gray'],
        ['#ff0000', 'red'],
        ['#800000', 'dark red'],
        ['#ff8000', 'orange'],
        ['#ffff00', 'yellow'],
        ['#00ff00', 'green'],
        ['#00ffff', 'teal'],
        ['#000080', 'navy'],
        ['#0000ff', 'blue'],
        ['#8000ff', 'purple'],
        ['#ff00ff', 'pink'],
        ['invalid', 'color']
    ];
    for (const [hex, expected] of cases) {
        await t.test(hex, () => assert.equal(getBasicColorName(hex), expected));
    }
});

test('simple clothing labels cover every group and keep unknown groups unchanged', () => {
    const labels = {
        Tops: 'top',
        Bottoms: 'pants or a skirt',
        Footwear: 'shoes',
        Outerwear: 'jacket or coat',
        Accessories: 'accessory',
        'Indian Wear': 'traditional clothing',
        Unknown: 'Unknown'
    };
    for (const [group, label] of Object.entries(labels)) {
        assert.equal(getSimpleClothingGroupName(group), label);
    }
});

test('closest-color lookup returns each stored color for its exact RGB value', async t => {
    for (const color of colorsData) {
        await t.test(color.name, () => {
            assert.equal(findClosestColor(...color.rgb), color);
        });
    }
    assert.equal(findClosestColor(0, 0, 0), colorsData.find(color => color.hex === '#111314'));
    assert.equal(findClosestColor(255, 255, 255), colorsData.find(color => color.hex === '#ffffff'));
});

test('color distance and outfit color scores handle valid, invalid, and missing values', () => {
    assert.equal(colorDistance('#123456', '#123456'), 0);
    assert.equal(colorDistance('#000000', '#ffffff'), Math.sqrt(3 * 255 ** 2));
    assert.equal(colorDistance('not a color', '#ffffff'), Infinity);

    const targets = [{ hex: '#123456' }, { hex: '#ffffff' }];
    assert.equal(scoreAnalyzerColor({ primary: { hex: '#123456' } }, targets), 1);
    assert.equal(scoreAnalyzerColor({ primary: {} }, targets), 0);
    assert.equal(scoreAnalyzerColor({}, targets), 0);
    assert.ok(scoreAnalyzerColor({ primary: { hex: '#000000' } }, targets) >= 0);
    assert.ok(scoreAnalyzerColor({ primary: { hex: '#000000' } }, targets) <= 1);
});

test('fit bonuses cover each garment group and do not award unrelated matches', () => {
    const cases = [
        [{ category: 'Jeans' }, 'Bottoms', 0.18],
        [{ fit: 'Straight fit' }, 'Bottoms', 0.18],
        [{ category: 'Chino pants' }, 'Bottoms', 0.18],
        [{ category: 'Overshirt' }, 'Tops', 0.12],
        [{ category: 'Polo shirt' }, 'Tops', 0.12],
        [{ category: 'Dress shirt' }, 'Tops', 0.12],
        [{ category: 'Sport coat' }, 'Tops', 0.12],
        [{ category: 'Oxford shoes' }, 'Footwear', 0.08],
        [{ category: 'Boots' }, 'Footwear', 0.08],
        [{ category: 'T-shirt' }, 'Tops', 0],
        [{ category: 'Loafers' }, 'Bottoms', 0],
        [{ category: 'Hat' }, 'Accessories', 0],
        [{}, 'Bottoms', 0]
    ];
    for (const [item, group, expected] of cases) {
        assert.equal(analyzerFitBonus(item, group), expected, `${group} should score ${expected}.`);
    }
});

test('purchase role groups cover all clothing groups and unknown groups', () => {
    const expectedRoles = {
        Tops: ['Bottoms', 'Footwear'],
        'Indian Wear': ['Footwear'],
        Bottoms: ['Tops', 'Footwear'],
        Footwear: ['Tops', 'Bottoms'],
        Outerwear: ['Tops', 'Bottoms', 'Footwear'],
        Accessories: ['Tops', 'Bottoms', 'Footwear'],
        Unknown: []
    };
    for (const [group, roles] of Object.entries(expectedRoles)) {
        assert.deepEqual(Array.from(purchaseRoleGroups(group)), roles);
    }
});

test('purchase evaluation matches owned items, lists missing pieces, and calculates its score', () => {
    const pants = { id: 1, group: 'Bottoms', primary: { name: 'Navy' } };
    const shoes = { id: 2, group: 'Footwear', primary: { name: 'Brown' } };
    const closetData = [pants, shoes];
    const evaluate = loadFunction('evaluatePurchaseCandidate', {
        closetData,
        purchaseRoleGroups
    });
    const purchaseItem = { group: 'Tops', primary: { name: 'Red' } };
    const palette = [
        { name: 'Red' },
        { name: 'Navy' },
        { name: 'Brown' }
    ];
    const result = evaluate(purchaseItem, palette, 17);
    assert.equal(result.id, 17);
    assert.equal(result.matches.length, 2);
    assert.equal(result.matches[0].item, pants);
    assert.equal(result.matches[1].item, shoes);
    assert.deepEqual(Array.from(result.gaps), []);
    assert.deepEqual(Array.from(result.remainingRoles), []);
    assert.equal(result.score, 6);
    assert.equal(result.palette, palette);
});

test('purchase evaluation does not use the purchased item as a closet match', () => {
    const evaluate = loadFunction('evaluatePurchaseCandidate', {
        closetData: [],
        purchaseRoleGroups
    });
    const result = evaluate(
        { group: 'Tops', primary: { name: 'Red' } },
        [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
        'palette'
    );
    assert.deepEqual(Array.from(result.matches), []);
    assert.equal(result.gaps.length, 2);
    assert.equal(result.score, -2);
});

test('proportion rules enforce inverted-triangle cut and rise requirements', async t => {
    const profile = makeProfile({ Build_Type: 'INVERTED_TRIANGLE' });
    for (const cut of ['SKINNY', 'RELAXED']) {
        await t.test(`excludes ${cut} pants`, () => {
            assert.equal(evaluateProportionalConstraint(makeTop(), makeBottom({ Cut: cut }), profile).exclusions.length, 1);
        });
    }
    for (const rise of ['LOW', 'HIGH']) {
        await t.test(`excludes ${rise} rise`, () => {
            assert.ok(evaluateProportionalConstraint(makeTop(), makeBottom({ Rise_Height: rise, Cut: 'STRAIGHT' }), profile).exclusions
                .some(reason => reason.includes('mid-rise')));
        });
    }
    assert.equal(evaluateProportionalConstraint(makeTop(), makeBottom({ Cut: 'STRAIGHT', Rise_Height: 'MID' }), profile).exclusions.length, 0);
    assert.ok(evaluateProportionalConstraint(makeTop(), makeBottom(), profile).modifiers.some(text => text.includes('mid-rise')));
    assert.ok(evaluateProportionalConstraint(makeTop(), makeBottom(), profile).modifiers.some(text => text.includes('tapered')));
});

test('short-height rules cover the 170 cm limit, low rise, long hems, and untucked tops', async t => {
    for (const height of [0, 150, 170]) {
        await t.test(`${height} cm is short vertical`, () => {
            const result = evaluateProportionalConstraint(makeTop(), makeBottom({ Rise_Height: 'LOW' }), makeProfile({ Height_cm: height }));
            assert.ok(result.exclusions.some(reason => reason.includes('longer-looking line')));
        });
    }
    for (const height of [170.1, 180, null]) {
        await t.test(`${height} cm does not trigger short-height exclusions`, () => {
            const result = evaluateProportionalConstraint(
                makeTop(),
                makeBottom({ Rise_Height: 'LOW', Hem_Break: 'FULL' }),
                makeProfile({ Height_cm: height })
            );
            assert.equal(result.exclusions.length, 0);
        });
    }
    for (const hem of ['POOLING', 'FULL']) {
        await t.test(`excludes ${hem} break for short vertical`, () => {
            const result = evaluateProportionalConstraint(
                makeTop(),
                makeBottom({ Hem_Break: hem }),
                makeProfile({ Height_cm: 170 })
            );
            assert.ok(result.exclusions.some(reason => reason.includes('stop near the top')));
        });
    }
    const unknownDetails = evaluateProportionalConstraint(makeTop(), makeBottom(), makeProfile({ Height_cm: 165 }));
    assert.ok(unknownDetails.modifiers.some(text => text.includes('around your waistband')));
    assert.ok(unknownDetails.modifiers.some(text => text.includes('near the top of your shoes')));
});

test('rise and top length add the correct split penalty, score, and styling advice', async t => {
    const lowAndLong = evaluateProportionalConstraint(
        makeTop({ Top_Length: 'LONG' }),
        makeBottom({ Rise_Height: 'LOW' }),
        makeProfile()
    );
    assert.equal(lowAndLong.score, -0.85);
    assert.ok(lowAndLong.modifiers.some(text => text.includes('Tuck this shirt')));

    const lowAndUnknown = evaluateProportionalConstraint(makeTop(), makeBottom({ Rise_Height: 'LOW' }), makeProfile());
    assert.equal(lowAndUnknown.score, -0.15);
    assert.ok(lowAndUnknown.modifiers.some(text => text.includes('Tuck in a longer shirt')));

    for (const rise of ['MID', 'HIGH']) {
        await t.test(`${rise} rise earns the split score`, () => {
            const result = evaluateProportionalConstraint(
                makeTop({ Top_Length: 'MID_FLY' }),
                makeBottom({ Rise_Height: rise }),
                makeProfile()
            );
            assert.equal(result.score, 0.24);
        });
        await t.test(`${rise} rise suggests tucking a long top`, () => {
            const result = evaluateProportionalConstraint(
                makeTop({ Top_Length: 'LONG' }),
                makeBottom({ Rise_Height: rise }),
                makeProfile()
            );
            assert.ok(result.modifiers.some(text => text.includes(`${rise.toLowerCase()}-rise pants`)));
        });
    }
    const unknownRise = evaluateProportionalConstraint(makeTop(), makeBottom(), makeProfile());
    assert.ok(unknownRise.modifiers.some(text => text.includes('add it in their details')));
});

test('silhouette rules reward straight cuts and neat hems as intended', () => {
    const straight = makeBottom({ Cut: 'STRAIGHT', Hem_Break: 'SLIGHT' });
    assert.equal(
        evaluateProportionalConstraint(makeTop(), straight, makeProfile({ Target_Silhouette: 'I_SILHOUETTE' })).score,
        0.22
    );
    assert.equal(
        evaluateProportionalConstraint(makeTop(), makeBottom({ Cut: 'TAPERED' }), makeProfile()).score,
        0.1
    );
    assert.equal(
        evaluateProportionalConstraint(makeTop(), makeBottom({ Hem_Break: 'POOLING' }), makeProfile({ Target_Silhouette: 'I_SILHOUETTE' })).score,
        0
    );
});

test('high head volume excludes thin synthetics and rewards structured fabric', async t => {
    const profile = makeProfile({ Head_Volume: 'HIGH' });
    const thinSynthetic = evaluateProportionalConstraint(
        makeTop({ Fabric_Type: 'THIN_SYNTHETIC' }),
        makeBottom(),
        profile
    );
    assert.equal(thinSynthetic.exclusions.length, 1);

    const lowWeight = evaluateProportionalConstraint(makeTop({ Fabric_Weight: 239 }), makeBottom(), profile);
    assert.equal(lowWeight.score, -0.2);
    assert.ok(lowWeight.modifiers.some(text => text.includes('structured top')));

    const thresholdWeight = evaluateProportionalConstraint(makeTop({ Fabric_Weight: 240 }), makeBottom(), profile);
    assert.equal(thresholdWeight.score, 0.18);

    const missingWeight = evaluateProportionalConstraint(makeTop(), makeBottom(), profile);
    assert.ok(missingWeight.modifiers.some(text => text.includes('fabric weight')));
});

test('lean builds value textured fabric and suggest pushing up sleeves', async t => {
    const profile = makeProfile({ Build_Type: 'LEAN_MUSCLE' });
    for (const fabricType of ['CORDUROY', 'HEAVY_PIQUE', 'WAFFLE']) {
        await t.test(`${fabricType} earns its texture score`, () => {
            const result = evaluateProportionalConstraint(
                makeTop({ Fabric_Type: fabricType, Fabric_Weight: 240 }),
                makeBottom(),
                profile
            );
            assert.ok(Math.abs(result.score - 0.34) < Number.EPSILON);
        });
    }
    const otherFabric = evaluateProportionalConstraint(makeTop({ Fabric_Weight: 240 }), makeBottom(), profile);
    assert.ok(otherFabric.modifiers.some(text => text.includes('push up the sleeves')));
    const thinFabric = evaluateProportionalConstraint(
        makeTop({ Fabric_Type: 'THIN_SYNTHETIC' }),
        makeBottom(),
        profile
    );
    assert.equal(thinFabric.exclusions.length, 1);
    assert.ok(thinFabric.modifiers.some(text => text.includes('push up the sleeves')));
});

test('relaxed pants with a compact top get a penalty and one clear warning', () => {
    for (const [cut, fit, expectedScore] of [
        ['RELAXED', '', -0.45],
        ['STRAIGHT', 'Oversized', -0.35]
    ]) {
        const result = evaluateProportionalConstraint(
            makeTop({ Top_Length: 'CROPPED' }),
            makeBottom({ Cut: cut, fit }),
            makeProfile()
        );
        assert.equal(result.score, expectedScore);
        assert.equal(result.modifiers.filter(text => text.includes('Avoid pairing this compact top')).length, 1);
    }
    const balanced = evaluateProportionalConstraint(
        makeTop({ Top_Length: 'LONG' }),
        makeBottom({ Cut: 'RELAXED' }),
        makeProfile()
    );
    assert.equal(balanced.score, 0);
});
