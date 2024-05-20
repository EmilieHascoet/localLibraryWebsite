import Author from './models/author.js';
import Book from './models/book.js';

// Import the mongoose module
import mongoose from "mongoose";
mongoose.set("strictQuery", false);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

const authors = [];
const books = [];

async function main() {
    console.log("Debug: About to connect");
    await mongoose.connect(mongoDB);
    console.log("Debug: Should be connected?");
    await createAuthors();
    await createBooks();
    console.log("Debug: Closing mongoose");
    mongoose.connection.close();
}

async function authorCreate(index, first_name, family_name, d_birth, d_death) {
    const authordetail = { first_name: first_name, family_name: family_name };
    if (d_birth != false) authordetail.date_of_birth = d_birth;
    if (d_death != false) authordetail.date_of_death = d_death;
  
    const author = new Author(authordetail);
    await author.save();
    authors[index] = author;
    console.log(`Added author: ${first_name} ${family_name}`);
}

async function bookCreate(index, title, summary, isbn, author, publication_date) {
    const bookdetail = {
      title: title,
      summary: summary,
      author: author,
      publication_date: publication_date,
      isbn: isbn,
    };
  
    const book = new Book(bookdetail);
    await book.save();
    books[index] = book;
    console.log(`Added book: ${title}`);
}

async function createAuthors() {
    console.log("Adding authors");
    await Promise.all([
        authorCreate(0, "Patrick", "Rothfuss", "1973-06-06", false),
        authorCreate(1, "Ben", "Bova", "1932-11-8", false),
        authorCreate(2, "Isaac", "Asimov", "1920-01-02", "1992-04-06"),
        authorCreate(3, "Bob", "Billings", false, false),
        authorCreate(4, "Jim", "Jones", "1971-12-16", false),
    ]);
}

async function createBooks() {
    console.log("Adding Books");
    await Promise.all([
        bookCreate(0,
        "The Name of the Wind (The Kingkiller Chronicle, #1)",
        "I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.",
        "9781473211896",
        authors[0],
        "2007-03-27"
        ),
        bookCreate(1,
        "The Wise Man's Fear (The Kingkiller Chronicle, #2)",
        "Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.",
        "9788401352836",
        authors[0],
        "2011-03-01"
        ),
        bookCreate(2,
        "The Slow Regard of Silent Things (Kingkiller Chronicle)",
        "Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.",
        "9780756411336",
        authors[0],
        "2014-10-28"
        ),
        bookCreate(3,
        "Apes and Angels",
        "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...",
        "9780765379528",
        authors[1],
        "2016-11-22"
        ),
        bookCreate(4,
        "Death Wave",
        "In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...",
        "9780765379504",
        authors[1],
        "2015-11-17"
        ),
        bookCreate(5,
        "Test Book 1",
        "Summary of test book 1",
        "ISBN111111",
        authors[4],
        "2021-01-01"
        ),
        bookCreate(6,
        "Test Book 2",
        "Summary of test book 2",
        "ISBN222222",
        authors[4],
        "2021-01-01"
        ),
    ]);
}