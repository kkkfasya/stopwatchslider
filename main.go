package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func main() {
	if err := serve(); err != nil {
		log.Fatalln(err)
	}
}

func serve() (err error) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	srv := &http.Server{
		Addr:         ":8080",
		BaseContext:  func(l net.Listener) context.Context { return ctx },
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 10 * time.Second,
		Handler:      httpHandler(),
	}

	srvErr := make(chan error, 1)
	go func() {
		log.Println("Running HTTP Server at localhost:8080")
		srvErr <- srv.ListenAndServe()
	}()

	select {
	case err = <-srvErr:
		return err
	case <-ctx.Done():
		stop()
	}

	err = srv.Shutdown(context.Background())
	return err
}

func httpHandler() http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /", http.FileServer(http.Dir("static")))
	return mux
}
