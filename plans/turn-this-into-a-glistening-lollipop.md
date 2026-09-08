# Plan: Move Blog & News from Campaigns Page to Homepage

The homepage has a `{/* Campaigns */}` section (lines ~817–862) showing two `DonationCard`s for fundraising campaigns. The `CampaignsPage` (`CampaignsPage` function, ~lines 2060–2177) contains an "Active Campaigns" section and a "Blog & News" section that renders `blogNewsItems` via the `MediaCard` component.

The request is to:
1. **Remove** the Campaigns section from the homepage entirely.
2. **Move** the Blog & News content from `CampaignsPage` into the homepage, in the same position where Campaigns was.
3. The Blog & News section should be **removed** from `CampaignsPage` after the move (it now lives on the homepage).

Everything else — `blogNewsItems` data, `MediaCard` component, `CampaignsPage` itself (with its Active Campaigns + "Start One" sections) — remains unchanged.

---

## File Modified

**`src/app/App.tsx`** only — two surgical edits.

---

## Change 1: Replace Campaigns section in `HomePage` with Blog & News

**Remove** this block from `HomePage` (lines ~817–862):
```jsx
{/* Campaigns */}
<section className="py-20 px-6 bg-white">
  ...SectionTag "Campaigns", "Latest Campaigns" h2, two DonationCards...
</section>
```

**Replace** it with the Blog & News section — same markup that currently lives in `CampaignsPage` (lines ~2122–2146), keeping `bg-white` background to match the existing rhythm:
```jsx
{/* Blog & News */}
<section className="py-20 px-6 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <SectionTag>Blog & News</SectionTag>
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#10202B] mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}>
        Stories & updates
      </h2>
      <p className="text-[#5C6B72] leading-relaxed">
        Articles, videos, and press coverage on our operations, partnerships, and impact.
      </p>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {blogNewsItems.map((item, i) => (
        <MediaCard key={i} {...item} />
      ))}
    </div>
  </div>
</section>
```

`blogNewsItems` and `MediaCard` are already defined at module scope (~lines 1937 and 1985) so they are available at render time — no new data or components needed.

---

## Change 2: Remove Blog & News section from `CampaignsPage`

**Remove** this block from `CampaignsPage` (lines ~2122–2146):
```jsx
<section className="py-20 px-6 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <SectionTag>Blog & News</SectionTag>
      ...
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {blogNewsItems.map((item, i) => (
        <MediaCard key={i} {...item} />
      ))}
    </div>
  </div>
</section>
```

`CampaignsPage` retains its hero, Active Campaigns section, and the "Start One" CTA section. `blogNewsItems` and `MediaCard` remain in the file (they are now used by the homepage).

---

## Verification

1. Homepage shows "Blog & News" section with 5 `MediaCard` items where Campaigns used to be
2. Video card still shows play button and embeds on click
3. `CampaignsPage` no longer shows the Blog & News section; it shows Active Campaigns + "Start One" CTA + CTABanner
4. No TypeScript errors; `blogNewsItems` and `MediaCard` are still referenced (from homepage)
