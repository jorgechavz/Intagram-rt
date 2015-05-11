$(document).ready(function(){
  var url = '<Your callback URL>'
  , socket = io.connect(url);
  var Insta = Insta || {};
  var url = url;

  //audio
  $('<audio id="notiAudio"><source src="/audio/notify.ogg" type="audio/ogg"><source src="/audio/notify.mp3" type="audio/mpeg"><source src="/audio/notify.wav" type="audio/wav"></audio>').appendTo('body');
  var audio = false;
  $("#enable-audio").click(function(e){
    $(this).toggleClass("audio-enabled");
    $(this).find("i").toggleClass("fa-volume-off").toggleClass("fa-volume-up");
    e.preventDefault();
    if(audio == false){
      audio = true;
    }else{
      audio = false;
    }
  });


  Insta.App = {
   init: function() {
       this.mostRecent();
       this.getData();
   },
   getData: function() {
        var self = this;
        socket.on('show', function(data) {
            var url = data.show;
            $.ajax({
                url: url,
                type: 'POST',
                crossDomain: true,
                dataType: 'jsonp'
            }).done(function (data) {
                self.renderTemplate(data);
            });
        });

        socket.on("new tweet",function(tweet){
          if(audio == true){
            $('#notiAudio')[0].play();
          }else{

          }
          self.renderTweet(tweet);
        });
    },
    mostRecent: function() {
        var self = this;
        socket.on('first', function (data) {
            var query = data,
                imgWrap = $('#imgContent');
          $.each(query,function(index,value){
            $.each(value,function(i,objeto){
                imgWrap.prepend("<a href='"+objeto.link+"' target='_blank' animated fadeIn title='"+objeto.caption.text+"'><div class='img-item'><img src='"+objeto.images.standard_resolution.url+"'></div></a>");
            });
          });
        });
        socket.on("first tweets",function(data){
          var tweets = data.statuses;
          $.each(tweets,function(index,value){
            self.renderTweet(value);
          });
        });
    },
    getTweetLink: function(tweet){
      var id = tweet.id_str;
      return "https://twitter.com/statuses/"+id;
    },
    renderTweet: function(tweet){
      var user_nickname = tweet.user.screen_name;
      var image_user = tweet.user.profile_image_url_https;
      var media = tweet.entities.media;
      var linkTweet = this.getTweetLink(tweet);
      imgWrap = $('#imgContent');
      if(media != undefined){
        var url_media = media[0].media_url_https;
        var html = "<a href='"+linkTweet+"' target='_blank' class='the-tweet animated fadeInLeft'><div class='user-data'><img class='img-author' src='"+image_user+"'><span>@"+user_nickname+"</span></div><div style='background-image: url("+url_media+")' class='img-item tweet-wrap'><div class='tweets stripe tweets-parse'>"+tweet.text+"</div></div></a>";
      }else{
        var html = "<a href='"+linkTweet+"' target='_blank' class='the-tweet animated fadeInLeft'><div class='user-data'><img class='img-author' src='"+image_user+"'><span>@"+user_nickname+"</span></div><div class='img-item tweet-wrap'><div class='tweets tweets-parse'>"+tweet.text+"</div></div></a>"
      }


      imgWrap.prepend(html);
      $(".tweets-parse").tweetParser({
        parseHashtags : true
      });
      $(".tweets-parse").removeClass("tweets-parse");
    },
    renderTemplate: function(data){
      var objeto = data.data[0],
      imgWrap = $('#imgContent');
      this.giveLikeTo(objeto);
      imgWrap.prepend("<a href='"+objeto.link+"' target='_blank' title='"+objeto.caption.text+"'><div class='img-item animated fadeIn'><img src='"+objeto.images.standard_resolution.url+"'></div></a>");
        last = $('#imgContent a:first-child'),
        lastSrc = $('#imgContent a:first-child').find('img').attr('src'),
        nextSrc = $('#imgContent a:nth-child(2)').find('img').attr('src');
      if( lastSrc === nextSrc ) {
          last.remove();
      }else{
        if(audio == true){
          $('#notiAudio')[0].play();
        }
      }
    },
    giveLikeTo: function(object){
      socket.emit("liketo",{object:object});
    }
  }

  Insta.App.init();
});
