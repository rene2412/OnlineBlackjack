#include <drogon/HttpController.h>
#include "../logic/game.h"
class GameController : public drogon::HttpController<GameController> {
        public:
                GameController() = default;
                METHOD_LIST_BEGIN
                        ADD_METHOD_TO(GameController::CurrentPlayerDecision, "/api/current-player-decision", drogon::Post);
                METHOD_LIST_END

                void CurrentPlayerDecision(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};
