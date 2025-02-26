"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import Cookies from "js-cookie";

const PasswordProtection = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if password is correct
    if (password === "masat!123") {
      // Set authentication cookie (expires in 7 days)
      Cookies.set("isAuthenticated", "true", { expires: 7, path: "/" });
      // Redirect to home page
      router.push("/");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ width: "100%", boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <LockIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Website Under Construction
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please enter the password to access the website.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Incorrect password. Please try again.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoFocus
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              Enter Website
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PasswordProtection; 