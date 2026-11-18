// Vercel serverless endpoint. Set GEMINI_API_KEY in Vercel environment variables.
// AI requests are intentionally disabled until the owner configures the key.
// Before enabling public paid access, add persistent per-user quotas and authentication.
const ALLOWED = new Set(['captions','products','hashtags','emails']);
const TONES = new Set(['Friendly','Professional','Playful','Bold']);
const PLATFORMS = new Set(['Instagram','Facebook','LinkedIn','Pinterest','TikTok','YouTube Shorts','Threads','Website']);
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  // SECURITY: Fail closed until verified server-side identity and persistent quotas exist.
  // A deployment flag or API key alone must never expose a billable public endpoint.
  return res.status(503).json({error:'AI generation is unavailable until secure authentication and usage limits are implemented.'});
  if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:'AI generation is not configured yet.'});
  // Do not expose an unmetered AI API to the public. This is a development-only gate.
  if(process.env.AI_STUDIO_GENERATION_ENABLED!=='true') return res.status(503).json({error:'AI generation is not enabled yet.'});
  const {topic,tool,tone,platform}=req.body||{};
  if(typeof topic!=='string'||topic.trim().length<3||topic.length>500||!ALLOWED.has(tool)||!TONES.has(tone)||!PLATFORMS.has(platform))
    return res.status(400).json({error:'Please enter a valid topic, tool, tone and platform.'});
  const instruction={
    captions:'Write one compelling social-media caption with a clear opening and relevant call to action.',
    products:'Write an appealing product description. Never invent specifications, prices, endorsements or availability. Mark missing facts as [verify detail].',
    hashtags:'Suggest up to 15 relevant hashtags, avoiding spam and unsupported trending claims.',
    emails:'Write a marketing email with subject, preview text, body and call to action. Include [unsubscribe link] placeholder.'
  }[tool];
  const prompt='You are a careful marketing copywriter. '+instruction+' Target platform: '+platform+'. Tone: '+tone+'. Topic: '+topic.trim()+'. Return only the finished draft, no explanations. Do not invent factual claims.';
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',{
      method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:450,temperature:0.7}})
    });
    if(!response.ok) return res.status(502).json({error:'AI provider unavailable. Try again later.'});
    const data=await response.json();
    const result=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
    if(!result) return res.status(502).json({error:'No content was returned.'});
    return res.status(200).json({text:result.slice(0,4000)});
  } catch(e) {return res.status(e.name==='AbortError'?504:502).json({error:'AI generation could not complete.'});}
  finally {clearTimeout(timeout);}
}
