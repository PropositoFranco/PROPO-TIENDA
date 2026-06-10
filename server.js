import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

app.post('/api/validate', async (req, res) => {
  console.log('REQUEST RECIBIDA')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': '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', 'anthropic-version': '2023-06-01' }, body: JSON.stringify(req.body) })
    const data = await r.json()
    console.log('STATUS:', r.status, JSON.stringify(data).slice(0,300))
    res.json(data)
  } catch(e) { console.log('ERR:', e.message); res.status(500).json({error:e.message}) }
})

app.options('/api/validate', cors())
app.listen(3001, () => console.log('Proxy en 3001'))