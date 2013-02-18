mongoose-error-prone
====================

A snippet of code that WOULD fail at automated testing with Jasmine, for illustration of mongoose's circular dependencies, but as a matter of fact, it doesn't fail. Yay! :)

I'll keep this around anyway, if it helps illustrates anything to anybody out there.

Pre-requisites
==============

You'll need to install `jasmine-node` globally in your computer in order to run (you'll need sudo permission to do this):
`$> sudo npm -g install jasmine-node`

You'll also need to install this project's required packages:
`$> npm install`

Usage
=====

Just run `jasmine-node` over the `userSpec.js` file. I recommend using the `--verbose` option:
`$> jasmine-node --verbose userSpec.js`
