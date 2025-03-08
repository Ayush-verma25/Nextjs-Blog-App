import mongoose from 'mongoose';

export const ConnectDB = async () => {
    await mongoose.connect('mongodb+srv://ayve012:7rEiTYl23T5iSMuj@ayv02.jiumxd9.mongodb.net/blog-app');
    console.log('Connected to MongoDB');
};