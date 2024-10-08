var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var homeRouter = require('./routes/home');
var enrollRouter = require('./routes/enroll');
// var usersRouter = require('./routes/users');
var bindRouter = require('./routes/bind');
var EMRsharingRouter = require('./routes/EMRsharing');
var createIdentityRouter = require('./routes/createIdentity');
var loginRouter = require('./routes/login');
var consentIdentityRouter = require('./routes/consentIdentity');
var verifyModuleRouter = require('./routes/verifyModule');
var transactionRecordRouter = require('./routes/transactionRecord');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homeRouter);
app.use('/enroll', enrollRouter);
app.use('/login', loginRouter);
app.use('/bind', bindRouter);
app.use('/EMRsharing', EMRsharingRouter);
app.use('/createIdentity', createIdentityRouter);
app.use('/consentIdentity', consentIdentityRouter);
app.use('/verifyModule', verifyModuleRouter);
app.use('/transactionRecord', transactionRecordRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
