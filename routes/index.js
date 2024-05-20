import express from 'express';
let router = express.Router();

// GET home page.
router.get("/", function (req, res) {
  res.redirect("/catalog");
});

export default router;
