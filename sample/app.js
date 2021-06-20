const path = require('path')
const express = require('express')

const app = express()
const port = 3000

const contentType = 'application/partial+json'

app.use(express.static(path.join(__dirname, '../')))
app.use(express.urlencoded({ extended: true }));

app.get('/replace', (req, res) => {
  res.set('Content-Type', contentType)
  res.json({
    "effects": [
      { 
        "selector": "#title",
        "action": "replace",
        "html": `<h1 id=\"title\">Replaced at ${new Date()}</h1>`
      }
    ]
  })
})

app.post('/form', (req, res) => {
  res.set('Content-Type', contentType)

  if(req.body.message.match(/^\w+$/)) {
    res.json({
      "effects": [
        {
          "selector": "#error",
          "action": "inner",
          "html": ''
        },
        {
          "selector": "#messages",
          "action": "appendChild",
          "html": `<li>${new Date()}: ${req.body.message}</li>`
        }
      ]
    })
  } else {
    res.json({
      "effects": [
        {
          "selector": "#error",
          "action": "inner",
          "html": `<p>message must be match /^[A-Za-z0-9_]$/ at ${new Date()}</p>`
        }
      ]
    })
  }
})

app.get('/', (req, res) => {
  res.header('Content-Type', 'text/html;charset=utf-8');
  res.end(indexHtml)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

const indexHtml = `<!DOCTYPE html>
<html lang="en">

<head>
  <title>pertial fetch sample</title>
  <script src="../index.js"></script>
</head>

<body>
  <h1 id="title">Partial Fetch Sample</h1>
  <button onClick="partial('./replace')">Change Title</button>

  <h1>post form</h1>
  <form action="./form" method="post" onSubmit="event.preventDefault();partial.form(this)">
    <div id="error"></div>

    <input name="message">
    <input type="submit">
  </form>

  <ul id="messages">    
  </ul>
</body>

</html>
`