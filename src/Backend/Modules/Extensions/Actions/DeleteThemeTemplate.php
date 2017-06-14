<?php

namespace Backend\Modules\Extensions\Actions;

/*
 * This file is part of Fork CMS.
 *
 * For the full copyright and license information, please view the license
 * file that was distributed with this source code.
 */

use Backend\Core\Engine\Base\ActionDelete as BackendBaseActionDelete;
use Backend\Core\Engine\Model as BackendModel;
use Backend\Modules\Extensions\Engine\Model as BackendExtensionsModel;
use Backend\Modules\Extensions\Form\ThemeTemplateDeleteType;

/**
 * This is the delete-action, it will delete a template
 */
class DeleteThemeTemplate extends BackendBaseActionDelete
{
    public function execute(): void
    {
        $deleteForm = $this->createForm(ThemeTemplateDeleteType::class);
        $deleteForm->handleRequest($this->getRequest());
        if (!$deleteForm->isSubmitted() || !$deleteForm->isValid()) {
            $this->redirect(BackendModel::createURLForAction('ThemeTemplates') . '&error=something-went-wrong');
        }
        $deleteFormData = $deleteForm->getData();

        // get parameters
        $this->id = (int) $deleteFormData['id'];

        // does the item exist
        if ($this->id !== 0 && BackendExtensionsModel::existsTemplate($this->id)) {
            // call parent, this will probably add some general CSS/JS or other required files
            parent::execute();

            // init var
            $success = false;

            // get template (we need the title)
            $item = BackendExtensionsModel::getTemplate($this->id);

            // valid template?
            if (!empty($item)) {
                // delete the page
                $success = BackendExtensionsModel::deleteTemplate($this->id);
            }

            // page is deleted, so redirect to the overview
            if ($success) {
                $this->redirect(BackendModel::createURLForAction('ThemeTemplates') . '&theme=' . $item['theme'] . '&report=deleted-template&var=' . rawurlencode($item['label']));
            } else {
                $this->redirect(BackendModel::createURLForAction('ThemeTemplates') . '&error=non-existing');
            }
        } else {
            // something went wrong
            $this->redirect(BackendModel::createURLForAction('ThemeTemplates') . '&error=non-existing');
        }
    }
}
