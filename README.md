# Esra Güvener Luxury Boutique

Pure HTML5, CSS3, and vanilla JavaScript luxury fashion boutique website for **Esra Güvener**.

## Project Structure

- `index.html` - main website markup
- `style.css` - responsive luxury UI, dark/light themes, animations
- `script.js` - theme switching, galleries, AI concierge, lazy embeds, interactions
- `assets/images/` - local fashion imagery
- `assets/icons/` - favicon and icons
- `vercel.json` - Vercel static hosting headers and caching
- `ai-proxy.example.js` - optional secure NVIDIA AI proxy example

## Local Preview

Open `index.html` directly in a browser, or run:

```bash
npm start
```

## Quality Check

```bash
npm run check
```

## Deploy To Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repository.
4. Use these settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: leave empty or use `.`
5. Deploy.

## AI Concierge

The site includes **Élise d’Or**, a boutique AI concierge with local fallback responses.

For production AI calls on Vercel, add these environment variables in **Project Settings -> Environment Variables**:

```bash
NVIDIA_API_KEY=your_rotated_nvidia_key
```

Optional:

```bash
NVIDIA_MODEL=meta/llama-4-maverick-17b-128e-instruct
AI_ALLOWED_ORIGIN=https://your-production-domain.com
```

The frontend calls `/api/ai`, which uses the private Vercel environment variable server-side.

Never expose NVIDIA, OpenAI, or other provider API keys in browser JavaScript.
