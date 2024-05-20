//import mongoose from "mongoose";
//const { Schema, model, SchemaTypes } = mongoose;
import { Schema, model, SchemaTypes } from "mongoose";
import { DateTime } from "luxon";

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: SchemaTypes.ObjectId, ref: "Author", required: true },
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    publication_date: { type: Date },
  });
  
  // Virtual for book's URL
  BookSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/catalog/book/${this._id}`;
  });

  BookSchema.virtual("publication_date_formatted").get(function() {
    let publication_date_formatted = ''; 
    if (this.publication_date != null) {
      publication_date_formatted = DateTime.fromJSDate(this.publication_date).toLocaleString(DateTime.DATE_MED);
    }
    return publication_date_formatted;
  })

export default model("Book", BookSchema);
