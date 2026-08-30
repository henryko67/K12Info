import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_EynLi5Xsa',
      userPoolClientId: '5v0o2glgka87uc3dnotn2pohgc',

      loginWith: {
        email: true
      },

      signUpVerificationMethod: 'code',

      userAttributes: {
        email: {
          required: true
        }
      }
    }
  }
});