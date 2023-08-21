import { resolve } from "inversify-react";
import {
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { FormEvent } from "react";
import styles from "./Login.Page.module.scss";
import AuthenticationService from "../services/Authentication.Service";
import { NavigateFunction, redirect } from "react-router-dom";

export interface ILoginPageProps {
    navigate: NavigateFunction;
}

interface ILoginPageState {}

export class LoginPage extends React.Component<
  ILoginPageProps,
  ILoginPageState
> {
  @resolve(AuthenticationService)
  private readonly _authenticationService: AuthenticationService;

  constructor(props: ILoginPageProps) {
    super(props);
    this.state = {};
  }

  async login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    try {
        await this._authenticationService.login(
            data.get("email") as string,
            data.get("password") as string
        );

        this.props.navigate("/", { replace: true });
    } catch {
        // TODO: Error handling.
    }
  }

  render() {
    return (
      <Container className={styles["login-page"]}>
        <Container className={styles["background-overlay"]}></Container>
        <Container maxWidth="sm">
          <Paper
            sx={{
              boxShadow: 3,
              borderRadius: 2,
              px: 4,
              py: 6,
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="div" className={styles["logo"]}></Typography>
            <Typography component="h1" variant="h6" sx={{ p: 1 }}>
              Please sign in to continue
            </Typography>
            <Box
              component="form"
              onSubmit={(event) => this.login(event)}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Container>
    );
  }
}
