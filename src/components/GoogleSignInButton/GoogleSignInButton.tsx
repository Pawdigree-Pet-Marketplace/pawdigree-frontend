import { GoogleLogin } from "@react-oauth/google";
import "./GoogleSignInButton.css";

type Props = {
  onCredential: (credential: string) => void;
  onError: () => void;
};

export default function GoogleSignInButton({ onCredential, onError }: Props) {
  return (
    <div className="google-signin">
      <GoogleLogin
        width="300"
        shape="pill"
        size="large"
        text="signup_with"
        onSuccess={(res) => {
          if (res.credential) onCredential(res.credential);
          else onError();
        }}
        onError={onError}
      />
    </div>
  );
}
