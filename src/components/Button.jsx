import "./Button.css";

export const Button = ({ children, variant = "primary", loading = false, disabled = false, ...props }) => {
  const isDisabled = loading || disabled;
  return (
    <button className={`btn btn--${variant}`} disabled={isDisabled} {...props}>
      {loading ? (
        <>
          <span className="spinner" />
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  );
};
