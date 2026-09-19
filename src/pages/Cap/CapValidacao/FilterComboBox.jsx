import { useEffect, useMemo, useRef, useState } from "react";

export const FilterComboBox = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione ou digite...",
  hasError = false,
  showLabel = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const optionRefs = useRef([]);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(
    () =>
      options?.length
        ? searchText
          ? options.filter((option) => typeof option === "string" && option.toLowerCase().includes(searchText.toLowerCase()))
          : options
        : [],
    [options, searchText]
  );

  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const selectOption = (option) => {
    onChange(option);
    setSearchText("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((current) => (current < filteredOptions.length - 1 ? current + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((current) => (current > 0 ? current - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0) selectOption(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        setSearchText("");
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSearchText("");
      }
    }, 25);
  };

  return (
    <div ref={containerRef} className="fcb" onBlur={handleBlur}>
      {showLabel && label && (
        <label htmlFor={id} className="fcb__label">
          {label}
        </label>
      )}
      <div className="fcb__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={`fcb__input${hasError ? " fcb__input--error" : ""}`}
          value={searchText || value}
          onChange={(event) => {
            setSearchText(event.target.value);
            setIsOpen(true);
            onChange(event.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        <span className="fcb__arrow" onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? "▴" : "▾"}
        </span>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="fcb__options" role="listbox">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              ref={(el) => (optionRefs.current[index] = el)}
              className={`fcb__option${index === highlightedIndex ? " fcb__option--active" : ""}`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
