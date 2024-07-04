const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const ChatbotConversation = require('../models/chatbotConversationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getChatbotConversation = catchAsync(async (req, res, next) => {
    let chatbotConversation = await ChatbotConversation.findOne({
        user: req.user.id,
    });
    if (!chatbotConversation) {
        chatbotConversation = await ChatbotConversation.create({
            user: req.user.id,
        });
    }
    return res.status(200).json({
        status: 'success',
        doc: {
            chatbotConversation,
        },
    });
});

exports.createChatbotConversationMessage = catchAsync(
    async (req, res, next) => {
        let chatbotConversation = await ChatbotConversation.findOne({
            user: req.user.id,
        });

        if (!chatbotConversation) {
            return next(new AppError('Chatbot conversation not found.', 404));
        }
        if (chatbotConversation.history.length > 100) {
            return next(
                new AppError(
                    'Chatbot conversation history is full. Clear the conversation to continue.',
                    400
                )
            );
        }
        const history = [
            {
                role: 'user',
                parts: [
                    {
                        text: "Pretend you're a Egyptian tour guide and historian. I will ask you questions about Egypt and its places and tours.",
                    },
                ],
            },
            {
                role: 'model',
                parts: [
                    {
                        text: "Hello! I'm an Egyptian tour guide and historian. I can help you with any questions you have about Egypt.",
                    },
                ],
            },
        ];
        for (let i = 0; i < chatbotConversation.history.length; i++) {
            p = history[i].parts;
            r = history[i].role;
            history.push({ role: r, parts: p });
        }
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 100,
            },
        });
        const userMessage = req.body.text;
        if (!userMessage) {
            return next(new AppError('Please provide a message.', 400));
        }

        const message = {
            role: 'user',
            parts: { text: req.body.text },
        };
        chatbotConversation.history.push(message);

        const result = await chat.sendMessage(req.body.text);
        const response = result.response.text();

        const messageResponse = {
            role: 'model',
            parts: { text: response },
        };

        chatbotConversation.history.push(messageResponse);
        await chatbotConversation.save();

        res.status(200).json({
            status: 'success',
            doc: {
                messageResponse,
            },
        });
    }
);

exports.clearChatbotConversation = catchAsync(async (req, res, next) => {
    await ChatbotConversation.deleteMany({
        user: req.user.id,
    });
    const chatbotConversation = await ChatbotConversation.create({
        user: req.user.id,
    });

    res.status(200).json({
        status: 'success',
        doc: {
            chatbotConversation,
        },
    });
});
