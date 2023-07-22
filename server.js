const express = require('express')
const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')
const methodOverride = require('method-override');
const qrcode = require("qrcode");
const path = require('path')

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://tanapumin:Fogus.45@cluster0.multub1.mongodb.net/ShortUrl', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('mongoose connected'))
    .catch((error) => console.log('Error connecting..'))

app.set('view engine', 'ejs')
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.get('/', async (req, res) => {
    const shortUrls = await ShortUrl.find()
    res.render('index', { shortUrls: shortUrls })
})

app.post('/shortUrls', async (req, res) => {
    await ShortUrl.create({ full: req.body.fullUrl })
    res.redirect('/')
})

app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
    if (shortUrl == null) return res.sendStatus(404)

    shortUrl.clicks++
    shortUrl.save()

    res.redirect(shortUrl.full)
})

app.get('/qrcode/:shortUrl', async (req, res) => {
    try {
        const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
        if (!shortUrl) return res.sendStatus(404);

        qrcode.toDataURL(shortUrl.full, (err, src) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }

            res.render('qrcode', {
                qrCodeData: src,
                shortUrl: shortUrl.short,
            });
        });
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});


app.delete('/shortUrls/:id', async (req, res) => {
    try {
        const deletedShortUrl = await ShortUrl.findByIdAndDelete(req.params.id);
        if (!deletedShortUrl) {
            return res.status(404).json({ error: 'Short URL not found.' });
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(5000, () => {
    console.log('connect port 5000');
});
