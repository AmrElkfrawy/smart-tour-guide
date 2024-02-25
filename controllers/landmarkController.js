exports.test = (req, res) => {
    res.status(200).json({
        statusbar: 'success',
        data: {
            message: 'test',
        },
    });
};
