# Contributing to Temper

I'm open to, and grateful for, any contributions you make.
By contributing to Temper, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting Issues and Asking Questions

Before opening an issue, please search the [issue tracker](https://github.com/ktripaldi/temperjs/issues) to make sure your issue hasn't already been reported.

### Bugs and Improvements

I use the issue tracker to keep track of bugs and improvements to Temper.
I encourage you to open issues to discuss improvements, architecture, theory, internal implementation, etc. If a topic has been discussed before, you will be asked to join the previous discussion.

### Pull Requests

I actively welcome your pull requests.

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints and is formatted with `prettier`. Run `yarn format` to run `prettier` on all files.
6. If you haven't already, read the [Code of Conduct](CODE_OF_CONDUCT.md).

### Getting Help

Please file issues liberally. That's the easiest way to contact me.
I'm eager for your questions, input, and to hear about your experience.

### Help Me Help You

It is a good idea to structure your code and question in a way that is easy to read to entice people to answer it. For example, I encourage you to use syntax highlighting, indentation, and split text in paragraphs.

Please keep in mind that people spend their free time trying to help you. You can make it easier for them if you provide versions of the relevant libraries and a runnable small project reproducing your issue. You can put your code on [JSBin](http://jsbin.com) or, for bigger projects, on GitHub. Make sure all the necessary dependencies are declared in `package.json` so anyone can run `npm install && npm start` and reproduce your issue.

## The `master` Branch is Unsafe

I will do my best to keep master in good shape, with tests passing at all times. But I will sometimes make API changes that your application might not be compatible with. I will do my best to communicate these changes and always version appropriately so you can lock into a specific version if need be.

## License

By contributing to Temper, you agree that your contributions will be licensed under the [MIT license](LICENSE).
