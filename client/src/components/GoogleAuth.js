import React from 'react';
import { connect } from 'react-redux';
import { signIn, signOut } from '../actions';
import { IconButton, Tooltip, Button } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import { Link, withRouter } from 'react-router-dom';


class GoogleAuth extends React.Component {
  // Wires up the API library to our project, loaded additional code into our library, and then initialized the authentication client
  componentDidMount() {
    
    // console.log(window.gapi);
    window.gapi.load('client:auth2', () => {
      window.gapi.client
        .init({
          clientId:
            "854431462593-vqo0k8ghhideugv5gpc1dvj227spe4cl.apps.googleusercontent.com",
          scope: "email",
        })
        .then(() => {
          this.auth = window.gapi.auth2.getAuthInstance();
          // Updates state in our redux store
          this.onAuthChange(this.auth.isSignedIn.get());
          // Waits for authentication state to change some time in the future
          this.auth.isSignedIn.listen(this.onAuthChange);
        });
    });
  }

  onAuthChange = (isSignedIn) => {
    const { history,redirectURL } = this.props
    if (isSignedIn) {
      this.props.signIn(this.auth.currentUser.get().getBasicProfile());
      console.log("when signed in, the redirect URL is: " + redirectURL)
      if(history && redirectURL !== null) history.push(redirectURL);
    } else {
      this.props.signOut();
      console.log("when note signed in, the redirected to home i.e. /")
      if(history) history.push("/");
    }
  };

  onSignInClick = () => {
    this.auth.signIn();
  };

  onSignOutClick = () => {
    this.auth.signOut();
  };

  renderAuthButton() {
    if (this.props.isSignedIn === null && this.props.type === 'appbar') {
      return null;
    } else if (this.props.isSignedIn && this.props.type === 'appbar') {
      return (

        <Tooltip title='Sign Out'>
          <IconButton color='primary' onClick={this.onSignOutClick}>
            <PersonIcon color='primary' />

          </IconButton>
        </Tooltip>
      );
    } else if (!this.props.isSignedIn && this.props.type === 'appbar') {
      return (
        <Tooltip title='Sign In with Google'>
          <IconButton onClick={this.onSignInClick}>
            <PersonIcon color="secondary" />
          </IconButton>
        </Tooltip>
      );
    } else if (this.props.isSignedIn && this.props.type === 'landing') {
      return (
        <React.Fragment>
          <Link to='/project/new'>
            <Button size='small' color='secondary' variant='contained'>
              Get Started
            </Button>
          </Link>
        </React.Fragment>
      );
    } else if (!this.props.isSignedIn && this.props.type === 'landing') {
      return (
        <React.Fragment>
          <Button
            size='small'
            color='secondary'
            variant='contained'
            onClick={this.onSignInClick}
          >
            Get Started
          </Button>
          ;
        </React.Fragment>
      );
    }
  }

  render() {
    return <div>{this.renderAuthButton()}</div>;
  }
}

const mapStateToProps = (state) => {
  return { isSignedIn: state.auth.isSignedIn,
    redirectURL: state.auth.redirectURL };
};

export default connect(mapStateToProps, { signIn, signOut })(withRouter(GoogleAuth));
