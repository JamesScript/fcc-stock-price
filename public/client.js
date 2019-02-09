$(function() {
  const userstories = $("#userstories");
  userstories.hide();
  const flashYellow = () => {
    $('#jsonResult').removeClass("flashYellow");
    requestAnimationFrame(() => { $('#jsonResult').addClass("flashYellow") });
  }
  $("#seeUserStories").click(() => {
    userstories.show();
    $("#seeUserStories").hide();
  });
  $('#testForm').submit(function(e) {
    $.ajax({
      url: '/api/stock-prices',
      type: 'get',
      data: $('#testForm').serialize(),
      success: function(data) {
        $('#jsonResult').text(JSON.stringify(data));
        flashYellow();
      }
    });
    e.preventDefault();
  });
  $('#testForm2').submit(function(e) {
    $.ajax({
      url: '/api/stock-prices',
      type: 'get',
      data: $('#testForm2').serialize(),
      success: function(data) {
        $('#jsonResult').text(JSON.stringify(data));
        flashYellow();
      }
    });
    e.preventDefault();
  });
});