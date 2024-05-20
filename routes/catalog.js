import express from "express";
const router = express.Router();

// Require controller modules.
import bookController from "../controllers/bookController.js";
import authorController from "../controllers/authorController.js";

/// BOOK ROUTES ///

// GET catalog home page.
router.get("/", bookController.index);

// GET request for creating a Book. NOTE This must come before routes that display Book (uses id).
router.get("/book/create", bookController.bookCreateGet);

// POST request for creating Book.
router.post("/book/create", bookController.bookCreatePost);

// GET request to delete Book.
router.get("/book/:id/delete", bookController.bookDeleteGet);

// POST request to delete Book.
router.post("/book/:id/delete", bookController.bookDeletePost);

// GET request to update Book.
router.get("/book/:id/update", bookController.bookUpdateGet);

// POST request to update Book.
router.post("/book/:id/update", bookController.bookUpdatePost);

// GET request for one Book.
router.get("/book/:id", bookController.bookDetail);

// GET request for list of all Book items.
router.get("/books", bookController.bookList);

/// AUTHOR ROUTES ///

// GET request for creating Author. NOTE This must come before route for id (i.e. display author).
router.get("/author/create", authorController.authorCreateGet);

// POST request for creating Author.
router.post("/author/create", authorController.authorCreatePost);

router.get("/author/:authorid/book/create", authorController.bookCreateGet);

// GET request to delete Author.
router.get("/author/:id/delete", authorController.authorDeleteGet);

// POST request to delete Author.
router.post("/author/:id/delete", authorController.authorDeletePost);

// POST request to delete an author's book in author delte page.
router.post('/author/:authorid/book/:bookid/delete', authorController.authorDeleteBookDeletePost);

// GET request to update Author.
router.get("/author/:id/update", authorController.authorUpdateGet);

// POST request to update Author.
router.post("/author/:id/update", authorController.authorUpdatePost);

// GET request for one Author.
router.get("/author/:id", authorController.authorDetail);

// GET request for list of all Authors.
router.get("/authors", authorController.authorList);

export default router;