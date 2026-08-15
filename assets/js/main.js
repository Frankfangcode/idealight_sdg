"use strict";

jQuery(document).ready(function ($) {
  $('.js-data').datepicker({
    language: "en"
  }); //E-mail Ajax Send
    
    var $preloader = $('#page-preloader'),
    $spinner   = $preloader.find('.spinner-loader');
    $spinner.fadeOut();
    $preloader.delay(50).fadeOut('slow');

  // $("form").submit(function () {
  //   //Change
  //   var th = $(this);
  //   $.ajax({
  //     type: "POST",
  //     url: "assets/mail/mail.php",
  //     //Change
  //     data: th.serialize()
  //   }).done(function () {
  //     UIkit.notification({
  //       message: 'Form sent successfully!',
  //       status: 'success',
  //       pos: 'top-center',
  //       timeout: 5000
  //     });
  //     setTimeout(function () {
  //       // Done Functions
  //       th.trigger("reset");
  //     }, 1000);
  //   });
  //   return false;
  // });
});