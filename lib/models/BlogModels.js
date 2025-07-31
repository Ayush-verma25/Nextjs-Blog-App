// lib/models/BlogModels.js
// Make sure your BlogModel looks like this:

import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Blog description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [10000, 'Description must be less than 10000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Startup', 'Technology', 'Lifestyle', 'General'],
    default: 'General'
  },
  author: {
    type: String,
    required: true,
    trim: true,
    default: 'Anonymous',
    maxlength: [100, 'Author name must be less than 100 characters']
  },
  image: {
    type: String,
    required: [true, 'Blog image is required']
  },
  authorImg: {
    type: String,
    default: '/default-author.png'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Add indexes for better performance
blogSchema.index({ date: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ title: 'text', description: 'text' }); // For text search

// Pre-save middleware to ensure data consistency
blogSchema.pre('save', function(next) {
  // Ensure title and description are trimmed
  if (this.title) this.title = this.title.trim();
  if (this.description) this.description = this.description.trim();
  
  // Ensure category is valid
  const validCategories = ['Startup', 'Technology', 'Lifestyle', 'General'];
  if (!validCategories.includes(this.category)) {
    this.category = 'General';
  }
  
  next();
});

// Create model with error handling for existing model
const BlogModel = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default BlogModel;
