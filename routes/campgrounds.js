var express = require("express"),
    router = express.Router(),
    Campground = require("../models/campgrounds"),
    middleware = require("../middleware"),
    NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", (req, res) => {
    Campground.find({}, (err, allCampgrounds) => {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", { campgrounds: allCampgrounds, page: "campgrounds" });
        }
    })
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, (req, res) => {
    var name = req.body.name,
        image = req.body.image,
        desc = req.body.description,
        price = req.body.price,
        author = {
            id: req.user._id,
            username: req.user.username
        }
    geocoder.geocode(req.body.location, (err, data) => {
        if (err || !data.length) {
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        var lat = data[0].latitude,
            lng = data[0].longitude,
            location = data[0].formattedAddress;
        newCampground = { name: name, image: image, description: desc, price: price, author: author, location: location, lat: lat, lng: lng };

        Campground.create(newCampground, (err, newlyCreated) => {
            if (err) {
                console.log(err);
            } else {
                console.log(newlyCreated);
                res.redirect("/campgrounds");
            }
        });
    });
});


//New route
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});

//SHOW - shows more info about one campground
router.get("/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/show", { campground: foundCampground });
        }
    });
});

//EDIT campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        res.render("campgrounds/edit", { campground: foundCampground });
    });
});

//UPDATE campground route
router.put("/:id", (req, res) => {
    geocoder.geocode(req.body.location, (err, data) => {
        if (err || !data.length) {
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) => {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/campgrounds");
            } else {
                req.flash("success", "Successfully Updated!")
                res.redirect("/campgrounds/" + updatedCampground.id);
            };
        });
    });
});

//DESTROY campground route
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findOneAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        };
    });
});

module.exports = router;