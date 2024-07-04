const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PartSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
});

const MessageSchema = new Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true,
    },
    parts: [PartSchema],
});

const ChatbotConversationSchema = new Schema({
    history: [MessageSchema],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chatbot conversation must belong to a user.'],
    },
});

// ChatbotConversationSchema.pre(/^find/, function (next) {
//     this.populate({
//         path: 'user',
//         select: 'name photo',
//     });
// });

const ChatbotConversation = mongoose.model(
    'ChatbotConversation',
    ChatbotConversationSchema
);

module.exports = ChatbotConversation;
