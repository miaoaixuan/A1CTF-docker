package general

import (
	"errors"
	"log"
	"path/filepath"
	"strings"
)

func SafeJoin(base, userInput string) (string, error) {
	basePath := filepath.Clean(base)

	fullPath := filepath.Join(basePath, userInput)
	fullPath = filepath.Clean(fullPath)

	if !strings.HasPrefix(fullPath, basePath) {
		return "", errors.New("potential directory traversal attack")
	}

	f2, _ := filepath.Abs(fullPath)
	log.Printf("%v\n", f2)

	return fullPath, nil
}
