const path = require("path");

module.exports = {
    mode: "development",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                loader: "babel-loader"
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"]
    },
    entry: {
        "multiplication": "./src/multiplication.ts"
    },
    output: {
        path: path.resolve(__dirname, "./dist/"),
        filename: "[name]-bundle.js"
    }
};
