import Book from "../models/book.js";
import Author from "../models/author.js";
import { body, validationResult } from "express-validator";


export async function index(req, res, next) {
  // Get details of books, authors counts (in parallel)
  const [
    numBooks,
    numAuthors,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    Author.countDocuments({}).exec(),
  ]);

  res.render("index", {
    title: "The Sanctuary of Forgotten Tales",
    book_count: numBooks,
    author_count: numAuthors,
  });
};

// Display list of all books.
export async function bookList(req, res) {
    let searchQuery = req.query.search || '';
    let sortOption = req.query.sort;
    let sortObject = {};

    switch(sortOption) {
        case 'title_asc':
        sortObject = { title: 1 };
        break;
        case 'title_desc':
        sortObject = { title: -1 };
        break;
        case 'published_asc':
        sortObject = { publish_date: 1 };
        break;
        case 'published_desc':
        sortObject = { publish_date: -1 };
        break;
        default:
        sortObject = { title: 1 };
    }

    const allBooks = await Book.find({title: new RegExp(searchQuery, 'i')}, 'title author')
        .populate('author')
        .sort(sortObject)
        .exec();

    res.render("book_list", { title: "Book List", book_list: allBooks, selectedOption: sortOption });
}

// Display detail page for a specific book.
export async function bookDetail(req, res, next) {
    try {
        // Get details of books, book instances for specific book
        const book = await Book.findById(req.params.id).populate("author").exec();

        if (book === null) {
            // No results.
            const err = new Error("Book not found");
            err.status = 404;
            return next(err);
        }

        res.render("book_detail", {
            title: book.title,
            book: book
        });
    }
    catch (err) {
        if (err.kind === 'ObjectId') {
            err.status = 404;
            err.message = "Invalid book ID";
        }
        return next(err);
    }
}

// Display book create form on GET.
export async function bookCreateGet(req, res, next) {
    // Get all authors and genres, which we can use for adding to our book.
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    
    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
    });
}

// Handle book create on POST.
export const bookCreatePost = [
    // Validate and sanitize fields.
    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("publication_date", "Invalid date of publication")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Book object with escaped and trimmed data
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            publication_date: req.body.publication_date,
            isbn: req.body.isbn,
        });

        // Data from form is invalid.
        if (!errors.isEmpty()) {
            //log errors
            const errorArray = errors.array();
            const errorObject = {};

            errorArray.forEarch(err => errorObject[err.path+"_error"] = err);
            
            // Get all authors and genres, which we can use for adding to our book.
            const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
            
            res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                ...errorObject,
            });
            return;
        } else {
            // Data from form is valid.

            // Check if Book with same isbn already exists.
            const bookExists = await Book.findOne({ isbn: req.body.isbn })
                .collation({ locale: "en", strength: 2 })
                .exec();
            if (bookExists) {
                // Book exists, redirect to its detail page.
                res.redirect(bookExists.url);
            } else {
                //save book.
                await book.save();

                // Redirect to new book record.
                res.redirect(book.url);
            }
        }
    },
];

// Display book delete form on GET.
export async function bookDeleteGet(req, res) {
    // Get details of book
    const book = await Book.findById(req.params.id).exec();

    if (book === null) {
        // No results.
        res.redirect("/catalog/books");
    }

    res.render("book_delete", {
        title: "Delete Book",
        book: book,
    });
}

// Handle book delete on POST.
export async function bookDeletePost(req, res) {
    await Book.findByIdAndDelete(req.params.id).exec();
    res.redirect("/catalog/books");
}

// Display book update form on GET.
export async function bookUpdateGet(req, res) {
    // Get book and authors for form.
    const [book, allAuthors] = await Promise.all([
        Book.findById(req.params.id).populate("author").exec(),
        Author.find().sort({ family_name: 1 }).exec(),
    ]);

    if (book === null) {
        // No results.
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        authorBook: book.author._id,
        book: book,
    });
}

// Handle book update on POST.
export const bookUpdatePost = [
    // Validate and sanitize fields.
    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("publication_date", "Invalid date of publication")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Book object with escaped and trimmed data and old id
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            publication_date: req.body.publication_date,
            isbn: req.body.isbn,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        // Data from form is invalid.
        if (!errors.isEmpty()) {
            //log errors
            const errorArray = errors.array();
            const errorObject = {};

            errorArray.forEarch(err => errorObject[err.path+"_error"] = err);
            
            // Get all authors, which we can use for adding to our book.
            const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
            
            res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                ...errorObject,
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
            // Redirect to new book record.
            res.redirect(updatedBook.url);
        }
    },
]

export default {
    index,
    bookList,
    bookDetail,
    bookCreateGet,
    bookCreatePost,
    bookDeleteGet,
    bookDeletePost,
    bookUpdateGet,
    bookUpdatePost
};