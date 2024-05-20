import author from "../models/author.js";
import Author from "../models/author.js";
import Book from "../models/book.js";
import { body, validationResult } from "express-validator";

// Display list of all Authors.
export async function authorList(req, res) {
    let searchQuery = req.query.search || '';
    let sortOption = req.query.sort;
    let sortObject = {};

    switch(sortOption) {
        case 'family_name_asc':
        sortObject = { family_name: 1 };
        break;
        case 'family_name_desc':
        sortObject = { family_name: -1 };
        break;
        case 'first_name_asc':
        sortObject = { first_name: 1 };
        break;
        case 'first_name_desc':
        sortObject = { first_name: -1 };
        break;
        case 'birth_date_asc':
        sortObject = { date_of_birth: 1 };
        break;
        case 'birth_date_desc':
        sortObject = { date_of_birth: -1 };
        break;
        default:
        sortObject = { title: 1 };
    }
    const allAuthors = await Author.find({$or: [
        {family_name: new RegExp(searchQuery, 'i')},
        {first_name: new RegExp(searchQuery, 'i')}
      ]})
      .sort(sortObject)
      .exec();

    res.render("author_list", {
        title: "Author List",
        author_list: allAuthors,
        selectedOption: sortOption,
    });
}

// Display detail page for a specific Author.
export async function authorDetail(req, res) {
    try {
        const [author, allBooksByAuthor] = await Promise.all([
            Author.findById(req.params.id).exec(),
            Book.find({ author: req.params.id }, "title summary").exec()

        ]) 

        if(author == null) {
            // No results.
            const err = new Error("Book not found");
            err.status = 404;
            return next(err);
        }

        res.render("author_detail", {author: author, author_books: allBooksByAuthor});
    }
    catch (err) {
        if (err.kind === 'ObjectId') {
            err.status = 404;
            err.message = "Invalid author ID";
        }
        return next(err);
    }
}

// Display Author create form on GET.
export function authorCreateGet(req, res) {
    res.render("author_form", { title: "Create Author" });
}

// Handle Author create on POST.
export const authorCreatePost = [
    // Validate and sanitize fields.
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
  
    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

            // Create Author object with escaped and trimmed data
            const author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
            });

        // Data from form is invalid.
        if (!errors.isEmpty()) {
            //log errors
            console.log(errors);
            // There are errors. Render form again with sanitized values/errors messages.
            const errorArray = errors.array();
            const errorObject = {};
            errorArray.forEach(err => errorObject[err.path + '_error'] = err);
            res.render("author_form", {
                title: "Create Author",
                author: author,
                ...errorObject,
            });
            return;
        } else {
            // Data from form is valid.

            // Check if Author with same name and dates already exists.
            const authorExists = await Author.findOne({ first_name: req.body.first_name, family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth, date_of_death: req.body.date_of_death})
                .collation({ locale: "en", strength: 2 })
                .exec();
            if (authorExists) {
                // Author exists, redirect to its detail page.
                res.redirect(authorExists.url);
            } else {
                //save author.
                await author.save();

                // Redirect to new author record.
                res.redirect(author.url);
            }
        }
    },
];

// Display book create form on GET.
export async function bookCreateGet(req, res, next) {
    // Get all authors and genres, which we can use for adding to our book.
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    
    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        authorBook: req.params.authorid,
    });
}

// Display Author delete form on GET.
export async function authorDeleteGet(req, res) {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        // No results.
        res.redirect("/catalog/authors");
    }

    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
    });
}

// Handle Author delete on POST.
export async function authorDeletePost(req, res) {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
        });
        return;
    } else {
        // Author has no books. Delete object and redirect to the list of authors.
        await Author.findByIdAndDelete(req.body.authorid);
        res.redirect("/catalog/authors");
    }
}

// Handle Book delete from Author
export async function authorDeleteBookDeletePost(req, res) {
    await Book.findByIdAndDelete(req.params.bookid).exec();
    res.redirect("/catalog/author/"+req.params.authorid+"/delete");
}

// Display Author update form on GET.
export async function authorUpdateGet(req, res) {
     // Get author for form.
     const author = await Author.findById(req.params.id);

    if (author === null) {
        // No results.
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_form", {
        title: "Update Author",
        author: author,
    });
}

// Handle Author update on POST.
export const authorUpdatePost = [
    // Validate and sanitize fields.
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
  
    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

            // Create Author object with escaped and trimmed data and old id
            const author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id,
            });

        // Data from form is invalid.
        if (!errors.isEmpty()) {
            //log errors
            console.log(errors);
            // There are errors. Render form again with sanitized values/errors messages.
            const errorArray = errors.array();
            const errorObject = {};
            errorArray.forEach(err => errorObject[err.path + '_error'] = err);
            res.render("author_form", {
                title: "Create Author",
                author: author,
                ...errorObject,
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});

            // Redirect to new author record.
            res.redirect(updatedAuthor.url);
        }
    },
];

export default {
    authorList,
    authorDetail,
    authorCreateGet,
    authorCreatePost,
    bookCreateGet,
    authorDeleteGet,
    authorDeletePost,
    authorDeleteBookDeletePost,
    authorUpdateGet,
    authorUpdatePost
}