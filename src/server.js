/*
#######################################################################
#
# Copyright (C) 2020-2024 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
/*
#######################################################################
#######               DO NOT MODIFY THIS FILE               ###########
#######################################################################
*/

const app = require('./app.js');

app.listen(3010, () => {
  console.log('CSE186 Assignment 5 Server Running');
  console.log('API Testing UI is at: http://localhost:3010/v0/api-docs/');
});
