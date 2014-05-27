'use strict';

angular.module('stormpathIdpApp')
  .controller('LoginCtrl', function ($scope,Stormpath,$window) {
    $scope.ready = false;
    $scope.errors = {
      badLogin: false,
      notFound: false,
      userMessage: false,
      unknown: false,
      googleReject: false,
      facebookReject: false
    };

    var providers;

    Stormpath.init.then(function initSuccess(){
      providers = Stormpath.providers;
      $scope.ready = true;
      $scope.hasGoogle = !!providers.google;
      $scope.hasFacebook = !!providers.facebook;
      $scope.hasSocial = $scope.hasGoogle || $scope.hasFacebook;
      if($scope.hasFacebook){
        initFB();
      }
    });

    function initFB(){
      $window.fbAsyncInit = function() {
        var FB = $window.FB;
        FB.init({
          appId: providers.facebook.clientId,
          xfbml: true,
          status: true,
          version: 'v2.0'
        });
      };
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = '//connect.facebook.net/es_LA/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      }($window.document, 'script', 'facebook-jssdk'));
    }

    if(Stormpath.verifiedAccount){
      $scope.username = Stormpath.verifiedAccount.email;
    }

    function clearErrors(){
      Object.keys($scope.errors).map(function(k){$scope.errors[k]=false;});
    }

    function showError(err){
      if(err.status===400){
        $scope.errors.badLogin = true;
      }
      else if(err.status===404){
        $scope.errors.notFound = true;
      }
      else if(err.userMessage || err.message){
        $scope.errors.userMessage = err.userMessage || err.message;
      }else{
        $scope.errors.unknown = true;
      }
    }

    function errHandler(err){
      if(err){
        showError(err);
      }
    }

    $scope.submit = function(){
      clearErrors();
      if($scope.username && $scope.password){
        Stormpath.login($scope.username,$scope.password,errHandler);
      }
    };

    $scope.googleLogin = function(){
      var gapi = $window.gapi;
      if(!gapi){
        return;
      }
      clearErrors();
      var params = {
        clientid: providers.google.clientId,
        scope: 'email',
        cookiepolicy: 'single_host_origin',
        callback: function(authResult){
          if (authResult.status.signed_in) {
            Stormpath.register({
              providerData: {
                providerId: 'google',
                accessToken: authResult.access_token
              }
            },errHandler);
          } else {
            if(authResult.error==='access_denied'){
              $scope.errors.googleReject = true;
            }
          }
        }
      };

      gapi.auth.signIn(params);
    };

    function fbRegister(response){
      Stormpath.register({
        providerData: {
          providerId: 'facebook',
          accessToken: response.authResponse.accessToken
        }
      },errHandler);
    }

    $scope.facebookLogin = function(){
      var FB = $window.FB;

      FB.login(function(response) {
        if(response.status === 'connected'){
          fbRegister(response);
        }
      },{scope: 'email'});

    };

    return $scope;
  });
