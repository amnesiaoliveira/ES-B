const authService = require('../services/auth-service');
const { HttpError } = require('../utils/http-error');
const { asyncHandler } = require('../utils/async-handler');

const authenticate = asyncHandler(async (req, _res, next) => {
    const header = req.get('authorization') || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) throw new HttpError(401, 'Autenticacao obrigatoria.');

    const user = await authService.findUserByToken(token);
    if (!user) throw new HttpError(401, 'Sessao invalida ou expirada.');

    req.user = user;
    req.token = token;
    next();
});

function requireProfile(profile) {
    return (req, _res, next) => {
        if (req.user.tipo_perfil !== profile) {
            return next(new HttpError(403, 'Usuario sem permissao para esta operacao.'));
        }
        next();
    };
}

function requireOwnId(req, _res, next) {
    if (Number(req.params.id) !== req.user.id) {
        return next(new HttpError(403, 'Acesso negado aos dados de outro usuario.'));
    }
    next();
}

module.exports = { authenticate, requireProfile, requireOwnId };
