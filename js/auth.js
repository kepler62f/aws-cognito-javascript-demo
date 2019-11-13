import $ from 'jquery';
import Auth from '@aws-amplify/auth'
import cognito from './config'

(function scopeWrapper($) {

    const authConfig = Auth.configure(cognito.config);

    async function signUp(username, password, onSuccess, onFailure) {
        try {
            const result = await Auth.signUp({
            username,
            password,
            });
            if (result) {
                if (result.userConfirmed === false) {
                    onSuccess(result);
                }
            }
        } catch(err) {
            onFailure(err.message || err);
        }
    }

    async function confirmSignUp(username, code, onSuccess, onFailure) {
        try {
            const result = await Auth.confirmSignUp(
                username,
                code,
                {forceAliasCreation: true}
            );
            if (result) {
                onSuccess(result);
            }
        } catch(err) {
            onFailure(err.message || err);
        }
    }

    async function signIn(username, password, onSuccess, onFailure) {
        try {
            const currentUser = await checkCurrentUser();
            if (!currentUser.isAuthenticated) {
                let user = await Auth.signIn(username, password);
                if (user) {
                    if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                        onFailure('NEW_PASSWORD_REQUIRED', user);
                    } else {
                        onSuccess();
                    }
                }
            }
        } catch (err) {

        }
    }

    async function signOut() {
        await Auth.signOut()
            .then(data => console.log(data))
            .catch(err => console.log(err));
    }

    async function resetPassword(email, code, newPassword, onSuccess, onFailure) {
        if (code == null && email) {
            try {
                let result = await Auth.forgotPassword(email);
                onSuccess(result);
            } catch(err) {
            }
        } else if (email && code && newPassword) {
            try {
                let result = await Auth.forgotPasswordSubmit(email, code, newPassword);
                onSuccess(result);
            } catch(err) {

            }
        } else {

        }
    }

    async function checkCurrentUser() {
        try {
            let user = null;
            user = await Auth.currentAuthenticatedUser();
            if (user) {
                return {
                        isAuthenticated: true
                }
            }
        } catch (err) {
            return {
                isAuthenticated: false
            }
        }
    }

    // Event handlers

    function handleSignUp(event) {
        let email = $('#emailInputRegister').val();
        let password = $('#passwordInputRegister').val();
        let password2 = $('#password2InputRegister').val();
        let onSuccess = function signUpSuccess(result) {
            alert('Registration successful. Please check your email inbox or spam folder for your verification code.');
            window.location.href = 'verify.html';
        };
        let onFailure = function registerFailure(err) {
            alert(err);
        };
        event.preventDefault();
        if (password === password2) {
            signUp(email, password, onSuccess, onFailure);
        } else {
            $("#registerException").html("<p>The passwords you provided did not match. Try again.</p>");
        }
    }

    function handleSignupVerification(event) {
        let email = $('#emailInputVerify').val();
        let code = $('#codeInputVerify').val();
        event.preventDefault();
        confirmSignUp(email, code,
            function verifySuccess(result) {
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = '/';
            },
            function verifyError(err) {
                $("#verificationException").html("<p>" + err + "</p>");
            }
        );
    }

    async function handleSignIn(event) {
        try {
            let email = $('#emailInputSignin').val();
            let password = $('#passwordInputSignin').val();
            event.preventDefault();
            let user = await checkCurrentUser();
            if (user.isAuthenticated) {
                alert('A user has already logged in.')
                window.location.href = 'user.html';
            } else {
                signIn(
                    email,
                    password,
                    function signinSuccess() {
                        window.location.href = 'user.html';
                    },
                    function signinError(err, obj) {
                        if (err === 'NEW_PASSWORD_REQUIRED') {
                            if (obj) {

                            }
                        } else if (err === 'UserNotFoundException' || err === 'NotAuthorizedException') {
                            $("#signinException").html("<p>The email address and/or password you entered did not match any account.</p>")
                        } else {

                        }
                    }
                );
            }
        } catch(err) {

        }
    }

    function handleSignOut(event) {
        signOut();
        window.location.href = '/';
    }

    function handleForgotPassword(event) {
        let email = $('#resetPasswordEmail').val();
        let onSuccess = (result) => {
            alert('Password reset request submitted');
            window.location.href = 'resetPasswordConfirm.html';
        };
        let onFailure = function changePasswordFailure(err) {
            alert(err);
        };
        event.preventDefault();
        resetPassword(
            email,
            null,
            null,
            onSuccess,
            onFailure
        );
    }

    function handleForgotPasswordConfirm(event) {
        let email = $('#resetPasswordConfirmEmail').val();
        let confirmationCode = $('#resetPasswordConfirmCode').val();
        let newPassword = $('#resetPasswordNew').val();
        let onSuccess = (result) => {
            alert('Password has been reset');
            window.location.href = '/';
        };
        let onFailure = function changePasswordFailure(err) {
            alert(err);
        };
        event.preventDefault();
        resetPassword(
            email,
            confirmationCode,
            newPassword,
            onSuccess,
            onFailure
        );
    }

    async function onUserSessionContainerLoad() {
        const currentUser = await checkCurrentUser();
        if (currentUser.isAuthenticated) {
            let user = await Auth.currentAuthenticatedUser();
            $('#cuscUserName').text(user.attributes.email);
            $('#cuscUserJwt').text(user.signInUserSession.accessToken.jwtToken);
        }
    }

    function togglePassword() {
        let p = $('#passwordInputSignin');
        if (p.attr('type') === "password") {
            p.attr('type', 'text');
        } else {
            p.attr('type', 'password');
        }
    }

    $(function onDocReady() {
        $('#signInForm').submit(handleSignIn);
        $('#signOutButton').click(handleSignOut);
        $('#registrationForm').submit(handleSignUp);
        $('#changePasswordForm').submit(handleChangePassword);
        $('#verificationForm').submit(handleSignupVerification);
        $('#resetPasswordForm').submit(handleForgotPassword);
        $('#resetPasswordConfirmForm').submit(handleForgotPasswordConfirm);
        $('#show-password').click(togglePassword);
        let currentUserSessionContainer = $('#currentUserSessionContainer');
        if (currentUserSessionContainer.length) {
            onUserSessionContainerLoad();
        } else {

        }
    });

}($));