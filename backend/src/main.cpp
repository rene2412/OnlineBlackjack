#include <drogon/HttpAppFramework.h>
#include <iostream>

int main() {
    //Set HTTP listener address and port
    drogon::app()
        .addListener("0.0.0.0", 8080)
        .setDocumentRoot("../../dist");
    
    //Load config file
    //drogon::app().loadConfigFile("../config.json");
    
    //Run HTTP framework,the method will block in the internal event loop
    drogon::app().registerHandler("/api/shuffle",
        [](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            auto json = req->getJsonObject();
            if (json)
                std::cout << "Received deck: " << json->toStyledString() << std::endl;
            else
                std::cout << "Error: No JSON received" << std::endl;
            
            auto resp = drogon::HttpResponse::newHttpJsonResponse({{"status", "ok"}});
            callback(resp);
        },
        {drogon::Post}
    );
    
    drogon::app().run();
    return 0;
}
